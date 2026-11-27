
.method public exitGame()V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lio/github/linuxuniverseofficial/coastalchaos/GameActivity$1;->this$0:Lio/github/linuxuniverseofficial/coastalchaos/GameActivity;
    invoke-virtual {v0, p0}, Landroid/app/Activity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method

.method public run()V
    .locals 1
    iget-object v0, p0, Lio/github/linuxuniverseofficial/coastalchaos/GameActivity$1;->this$0:Lio/github/linuxuniverseofficial/coastalchaos/GameActivity;
    invoke-virtual {v0}, Landroid/app/Activity;->finishAndRemoveTask()V
    return-void
.end method
