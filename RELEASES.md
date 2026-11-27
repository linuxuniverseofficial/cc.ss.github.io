# Como gerar e publicar uma release

## Chromium obrigatório no Windows e no Linux

Em toda release, empacote o Chromium via Electron dentro do EXE e do AppImage, junto com os avisos de licença. A abertura padrão deve funcionar sem baixar o motor e sem exigir WebView2 ou um navegador instalado. Ao atualizar o Electron, atualize a versão e o SHA-256 da distribuição oficial nos dois scripts de build.

Antes de publicar, confira o motor dentro de cada artefato final e abra o jogo pelo launcher padrão. Use `tools/build-release.sh` para o EXE e `tools/build-appimage.sh` para o AppImage.

## 1. Preparar a revisão

- Atualize a revisão com `sh tools/nova-build.sh rNN` quando houver uma nova build do jogo. Para só publicar uma build existente, use a revisão atual.
- Confirme o conteúdo do commit e valide a sintaxe dos scripts alterados. Inclua no Git todos os arquivos distribuíveis da revisão.
- No APK, siga também [APK.md](APK.md). A janela Android deve abrir em paisagem e tela cheia. Teste o ícone, os menus e o modo História/Livre no aparelho.

## 2. Gerar os três arquivos

Em Linux, instale Python 3, Go 1.24.10 ou compatível, curl, Android SDK Platform 35 e Build Tools 35.0.1. Use uma pasta de saída fora do Git.

Carregue as variáveis a seguir no ambiente local. Use caminhos absolutos para o SDK e a chave. Informe a senha por entrada segura ou pelo gerenciador de segredos.

| Variável | Uso |
| --- | --- |
| `ANDROID_SDK_ROOT` | Pasta do SDK com `platforms/android-35` e `build-tools/35.0.1`. |
| `APKTOOL_JAR` | Caminho do Apktool JAR (testado com 2.4.1) para montar a ponte de saída do APK. |
| `ANDROID_KEYSTORE` | Keystore Android. Use o certificado anterior para atualizar uma instalação existente. |
| `ANDROID_KEY_ALIAS` | Alias da chave no keystore. |
| `ANDROID_KS_PASS` | Senha do keystore. O script lê do ambiente. |
| `ANDROID_TEMPLATE_APK` | Opcional. Caminho local para o APK publicado da r67. O script obtém a cópia pública se a variável estiver vazia. |
| `GO_BIN` | Opcional. Caminho do Go se o comando `go` na máquina for outro programa. |

```bash
bash tools/build-release.sh ../entregas
```

O script gera o ZIP web com a pasta `v77/`, o APK de teste e o EXE portátil Windows x64. Ele valida a integridade das versões e a assinatura do APK.

- **Android.** O script reutiliza a atividade nativa comprovada do APK r67, fixada por SHA-256, recompila manifesto e ícone e inclui os arquivos da revisão atual. Para alterar a própria atividade nativa, será preciso preparar um novo launcher e atualizar a referência do template. A chave original da série r65–r67 deve ser recuperada de um backup privado para manter atualizações em cima desses APKs. Se estiver indisponível, use uma nova chave para instalações novas e informe que ela não atualiza as instalações assinadas com a anterior. Guarde a nova chave em local privado.
- **Windows.** O EXE portátil inclui Electron e Chromium e abre em tela cheia. Na inicialização, extrai o runtime no diretório temporário do usuário e o remove ao sair. Os saves do Electron ficam no perfil do usuário. O build verifica o SHA-256 da distribuição oficial. Para reutilizar um download local, defina `ELECTRON_WINDOWS_ZIP`. A opção explícita `--browser` abre o navegador padrão. O EXE é distribuído sem assinatura digital. Quem migrar do launcher WebView2 da r68 deve exportar o save dentro do jogo e carregá-lo na r69.
- **ZIP.** O pacote usa os arquivos rastreados no Git na pasta de trabalho. `online/data/`, chaves e arquivos locais fora do Git ficam fora.

## 3. Publicar no GitHub

Confira a sessão com `gh auth status --hostname github.com`. Se o GitHub CLI já estiver autorizado neste ambiente, reutilize a sessão. Caso contrário, rode `gh auth login --hostname github.com --git-protocol https --web` e solicite que o usuário aprove o código de dispositivo em [github.com/login/device](https://github.com/login/device), no próprio navegador. Nunca peça senha ou token pelo chat.

Publique primeiro o commit da revisão na `main` e anote o SHA remoto. Prepare um arquivo Markdown com resumo das mudanças e instruções dos três downloads. Use a tag no formato `v4-rNN`.

```bash
repo=linuxuniverseofficial/cc.ss.github.io
rev=$(cat version.txt)
tag="v4-$rev"
stem="coastal-chaos-$tag"
# Defina COMMIT com o SHA remoto da build e NOTES com o caminho das notas Markdown.
gh release create "$tag" \
  "../entregas/$stem-android-debug.apk" \
  "../entregas/$stem-windows-x64.exe" \
  "../entregas/$stem.zip" \
  --repo "$repo" --target "$COMMIT" \
  --title "Coastal Chaos: Sunset Shores $tag" --notes-file "$NOTES"
gh release view "$tag" --repo "$repo" --json url,tagName,isDraft,assets
```

Se a release já existir e faltar um download, use `gh release upload "$tag" CAMINHO_DO_ARQUIVO --repo "$repo"`. Preserve os arquivos que já estão publicados. Na conferência final, procure os três nomes, tamanho correto, estado `uploaded` e `isDraft: false`. Entregue o link da release e informe quais testes em aparelhos reais ficaram pendentes.

## AppImage para Linux x86_64

Execute `bash tools/build-appimage.sh ../entregas` na revisão do jogo. O script usa Bash, curl, unzip e appimagetool x86_64. Defina `APPIMAGETOOL` para indicar o executável e, opcionalmente, `APPIMAGE_RUNTIME` para usar uma cópia local do runtime Type 2. O pacote inclui Electron com Chromium, os avisos de licença do fornecedor e os dados do jogo. O launcher abre em tela cheia e usa uma origem local estável para os saves.

Teste o menu e a geração da cidade antes de anexar o arquivo à release com `gh release upload v4-rNN ../entregas/coastal-chaos-v4-rNN-linux-x86_64.AppImage`. Para jogar, dê permissão de execução ao arquivo e abra-o. Em sistemas sem FUSE, use a opção `--appimage-extract-and-run`.
