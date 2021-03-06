var app

$(window).on("load", function() {

    Utils.hideLoader()

    var em = Utils.getBodyFontSize()

    app = new App({
        paths: App.defaults.paths.all(),
        spatial: false,
        debug: false,
        pointRadius: 1.8*em,
        paddingFactor: 1
    })

    app.addCircle({
        xFunc: Circle.defaults.xFunc1,
        yFunc: Circle.defaults.yFunc1,
        options: Circle.defaults.options.percussive,
        shake: true,
        // binary: "binary-placeholder",
    })

    app.addCircle({
        xFunc: Circle.defaults.xFunc2,
        yFunc: Circle.defaults.yFunc2,
        options: Circle.defaults.options.notes,
        shake: true,
        // binary: "binary-placeholder-2",
        circleBackgroundColor: COLORS.lightgreen
    })

})
