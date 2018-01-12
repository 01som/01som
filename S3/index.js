var app

$(function() {

    app = new App()

    app.addCircle({
        xFunc: function() { if (Utils.isLandscape()) return app.width/4; else return app.width/2 },
        yFunc: function() { if (Utils.isLandscape()) return app.height/2; else return app.height/4 },
        options: Circle.defaults.options.percussive,
        shake: true,
        binary: "binary-placeholder-1",
        sequencer: false
    })

    app.addCircle({
        xFunc: function() { if (Utils.isLandscape()) return 3*(app.width/4); else return app.width/2 },
        yFunc: function() { if (Utils.isLandscape()) return app.height/2; else return 3*(app.height/4) },
        options: Circle.defaults.options.notes,
        shake: true,
        binary: "binary-placeholder-2",
        sequencer: true,
        circleBackgroundColor: COLORS.lightgreen
    })
})
