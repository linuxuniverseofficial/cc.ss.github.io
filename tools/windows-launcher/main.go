package main

import (
	"archive/zip"
	"bytes"
	_ "embed"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

//go:embed desktop.zip
var desktopZip []byte

const host = "127.0.0.1:28467"
const gameURL = "http://" + host + "/"

var user32 = syscall.NewLazyDLL("user32.dll")

func message(body string) {
	text, _ := syscall.UTF16PtrFromString(body)
	title, _ := syscall.UTF16PtrFromString("Coastal Chaos: Sunset Shores")
	user32.NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(text)), uintptr(unsafe.Pointer(title)), 0x30)
}

func assets() (http.Handler, error) {
	bundle, err := zip.NewReader(bytes.NewReader(desktopZip), int64(len(desktopZip)))
	if err != nil {
		return nil, err
	}
	files := make(map[string]*zip.File)
	for _, f := range bundle.File {
		name, ok := strings.CutPrefix(f.Name, "resources/app/game/")
		if !ok || f.FileInfo().IsDir() {
			continue
		}
		switch strings.SplitN(name, "/", 2)[0] {
		case "backup", "online", "tools", "sw.js", "pwa.js":
			continue
		}
		files[name] = f
	}
	if files["index.html"] == nil {
		return nil, fmt.Errorf("index.html ausente")
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host != host {
			http.Error(w, "Host inválido", http.StatusForbidden)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name == "" {
			name = "index.html"
		}
		f := files[name]
		if f == nil {
			http.NotFound(w, r)
			return
		}
		rc, err := f.Open()
		if err != nil {
			http.Error(w, "Erro ao abrir arquivo", 500)
			return
		}
		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			http.Error(w, "Erro ao ler arquivo", 500)
			return
		}
		if name == "index.html" {
			lines := strings.Split(string(data), "\n")
			for i, line := range lines {
				if strings.Contains(line, `src="pwa.js`) {
					lines[i] = ""
				}
			}
			data = []byte(strings.Join(lines, "\n"))
		}
		w.Header().Set("Cache-Control", "no-store")
		http.ServeContent(w, r, path.Base(name), time.Time{}, bytes.NewReader(data))
	}), nil
}

func openBrowser() error {
	action, _ := syscall.UTF16PtrFromString("open")
	url, _ := syscall.UTF16PtrFromString(gameURL)
	result, _, _ := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW").Call(
		0, uintptr(unsafe.Pointer(action)), uintptr(unsafe.Pointer(url)), 0, 0, 1)
	if result <= 32 {
		return fmt.Errorf("não foi possível abrir o navegador padrão (%s)", strconv.FormatUint(uint64(result), 10))
	}
	return nil
}

func run() error {
	browser := flag.Bool("browser", false, "Abre no navegador padrão")
	flag.Parse()
	if !*browser {
		return launchDesktop()
	}
	handler, err := assets()
	if err != nil {
		return err
	}
	listener, err := net.Listen("tcp4", host)
	if err != nil {
		return fmt.Errorf("feche outra instância do Coastal Chaos e tente novamente: %w", err)
	}
	defer listener.Close()
	server := &http.Server{Handler: handler, ReadHeaderTimeout: 5 * time.Second}
	defer server.Close()
	go server.Serve(listener)
	if err := openBrowser(); err != nil {
		return err
	}
	message("O jogo está no navegador. Feche esta janela quando terminar de jogar.")
	return nil
}

func unpack(file *zip.File, root string) error {
	name, err := filepath.Localize(file.Name)
	if err != nil || !filepath.IsLocal(name) {
		return fmt.Errorf("caminho inválido no pacote: %s", file.Name)
	}
	dest := filepath.Join(root, name)
	if err := os.MkdirAll(filepath.Dir(dest), 0700); err != nil {
		return err
	}
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	dst, err := os.Create(dest)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(dst, src)
	closeErr := dst.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func launchDesktop() error {
	bundle, err := zip.NewReader(bytes.NewReader(desktopZip), int64(len(desktopZip)))
	if err != nil {
		return err
	}
	dir, err := os.MkdirTemp("", "CoastalChaos-*")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dir)
	for _, file := range bundle.File {
		if !file.FileInfo().IsDir() {
			if err := unpack(file, dir); err != nil {
				return err
			}
		}
	}
	cmd := exec.Command(filepath.Join(dir, "electron.exe"))
	cmd.Dir = dir
	return cmd.Run()
}

func main() {
	if err := run(); err != nil {
		message(err.Error())
	}
}
