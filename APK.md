# Build Android do Coastal Chaos

## Regras de cada APK

- Use a arte oficial em `appicons/icon-512.png`. Empacote um ícone adaptativo para Android 8 ou superior com fundo escuro e um ícone de fallback para Android 7. Aponte `android:icon` e `android:roundIcon` para os recursos do launcher. Verifique o ícone instalado em máscaras redonda e quadrada arredondada, sem halo ou borda branca.
- A atividade deve abrir em paisagem e tela cheia imersiva desde o início. Reaplique o modo imersivo quando a janela recuperar o foco. Dentro do APK, o jogo deve ocultar os controles de tela cheia e o botão de instalação web. Verifique o menu inicial, a pausa e a volta de outro app. Os painéis devem se ajustar aos controles visíveis, sem linhas vazias.
- O seletor do APK deve exibir somente História e Livre, com os dois cartões centralizados. Online permanece no código e fica oculto na interface do APK. A navegação por toque, teclado e controle deve acessar somente as opções visíveis. No navegador, o seletor continua exibindo Online.
- A atividade expõe a ponte nativa `CoastalAndroid`. O jogo usa essa ponte para ativar as regras específicas do APK e salvar arquivos `.psave`.

## Empacotamento e validação

1. Embuta os arquivos da revisão atual, incluindo HTML, CSS, JavaScript, bibliotecas e mídia local. Confira que `version.txt`, o identificador de build do jogo e o manifesto Android apontam para a revisão correta. Aumente o `versionCode`.
2. Assine o APK com a mesma chave da série de teste se ele precisar atualizar a instalação anterior. Verifique a assinatura, o identificador do pacote, o ícone adaptativo e a integridade do APK.
3. Em um aparelho real, instale ou atualize o APK. Confira o ícone, a abertura em tela cheia, a pausa e o seletor História/Livre. Gere uma cidade em modo avião e teste carregar e exportar um save. Registre separadamente qualquer etapa que só passou por verificação automatizada.
