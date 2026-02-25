let CallBack = {}
window.addEventListener("message", function (event) {
    const nui = event.data;
    if (nui.type === undefined) {
        console.error("[NuiManager] Type undefined!");
        return;
    }
    const functionCB = CallBack[nui.type];
    if (typeof (functionCB) !== "function") {
        console.error("[NuiManager] CallBack Type Not Allow! / Type: " + nui.type)
        return;
    }

    functionCB(nui);
});