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
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"

	webview "github.com/jchv/go-webview2"
)

//go:embed game.zip
var gameZip []byte

const host = "127.0.0.1:28467"
const gameURL = "http://" + host + "/"

var user32 = syscall.NewLazyDLL("user32.dll")

func message(body string) {
	text, _ := syscall.UTF16PtrFromString(body)
	title, _ := syscall.UTF16PtrFromString("Coastal Chaos: Sunset Shores")
	user32.NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(text)), uintptr(unsafe.Pointer(title)), 0x30)
}

func assets() (http.Handler, error) {
	bundle, err := zip.NewReader(bytes.NewReader(gameZip), int64(len(gameZip)))
	if err != nil {
		return nil, err
	}
	files := make(map[string]*zip.File)
	for _, f := range bundle.File {
		name, ok := strings.CutPrefix(f.Name, "v77/")
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
	if *browser {
		if err := openBrowser(); err != nil {
			return err
		}
		message("O jogo está no navegador. Pressione F11 no Edge ou Chrome para tela cheia. Feche esta janela somente quando terminar de jogar.")
		return nil
	}
	profile, err := os.UserCacheDir()
	if err != nil {
		return err
	}
	view := webview.NewWithOptions(webview.WebViewOptions{
		DataPath: filepath.Join(profile, "CoastalChaos", "WebView2"), AutoFocus: true,
		WindowOptions: webview.WindowOptions{Title: "Coastal Chaos: Sunset Shores", Width: 1280, Height: 720, Center: true},
	})
	if view == nil {
		return fmt.Errorf("não foi possível iniciar o jogo. Instale o Microsoft Edge WebView2 Runtime ou execute com --browser")
	}
	defer view.Destroy()
	window := uintptr(view.Window())
	const styleIndex = ^uintptr(15)
	type rect struct{ left, top, right, bottom int32 }
	type monitorInfo struct {
		size         uint32
		bounds, work rect
		flags        uint32
	}
	monitor, _, _ := user32.NewProc("MonitorFromWindow").Call(window, 2)
	info := monitorInfo{size: uint32(unsafe.Sizeof(monitorInfo{}))}
	ok, _, _ := user32.NewProc("GetMonitorInfoW").Call(monitor, uintptr(unsafe.Pointer(&info)))
	if ok != 0 {
		user32.NewProc("SetWindowLongPtrW").Call(window, styleIndex, 0x96000000)
		r := info.bounds
		user32.NewProc("SetWindowPos").Call(window, 0, uintptr(r.left), uintptr(r.top), uintptr(r.right-r.left), uintptr(r.bottom-r.top), 0x64)
	} else {
		user32.NewProc("ShowWindow").Call(window, 3)
	}
	view.Navigate(gameURL)
	view.Run()
	return nil
}

func main() {
	runtime.LockOSThread()
	if err := run(); err != nil {
		message(err.Error())
	}
}
