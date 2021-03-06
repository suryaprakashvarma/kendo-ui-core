(function() {
    module("events", {
        setup: function() {
            kendo.effects.disable();
        },
        teardown: function() {
            QUnit.fixture.closest("body").find(".k-window-content").each(function(idx, element){
                $(element).data("kendoWindow").destroy();
            });
            QUnit.fixture.closest("body").find(".k-overlay").remove();
            $.mockjax.clear();
        }
    });

    function createWindow(options) {
        var dialog = $("<div />").appendTo(QUnit.fixture).kendoWindow(options);
        var dialogObject = dialog.data("kendoWindow");

        return dialogObject;
    }

    test("clicking on window brings it in front of other windows and adds k-state-focused", 2, function() {
        jasmine.clock().install();
        var firstWindow = createWindow(),
            secondWindow = createWindow();

        firstWindow.element.trigger("mousedown");
        jasmine.clock().tick();
        equal(+firstWindow.wrapper.css("zIndex"), +secondWindow.wrapper.css("zIndex") + 2);
        ok(firstWindow.wrapper.is(".k-state-focused"));
        jasmine.clock().uninstall();
    });

    test("clicking on minimized window brings it in front of other windows and adds k-state-focused", 2, function() {
        jasmine.clock().install();
        var firstWindow = createWindow(),
            secondWindow = createWindow();

        firstWindow.minimize();
        firstWindow.wrapper.trigger("mousedown");
        jasmine.clock().tick();
        equal(+firstWindow.wrapper.css("zIndex"), +secondWindow.wrapper.css("zIndex") + 2);
        ok(firstWindow.wrapper.is(".k-state-focused"));
        jasmine.clock().uninstall();
    });

    test("clicking on inactive iframe window adds k-state-focused", 1, function() {
        jasmine.clock().install();
        var firstWindow = createWindow({
                content: "/base/tests/window/blank.html",
                iframe: true}),
            secondWindow = createWindow({
                content: "/base/tests/window/blank.html",
                iframe: true});

        firstWindow.element.find(".k-overlay").trigger("mousedown");
        jasmine.clock().tick();
        ok(firstWindow.wrapper.is(".k-state-focused"));
        jasmine.clock().uninstall();
    });

    asyncTest("loading of iframe triggers load event", 1, function() {
        var timeout = setTimeout(start, 2000);

        createWindow({
            content: "/base/tests/window/blank.html",
            iframe: true,
            refresh: function() {
                clearTimeout(timeout);
                start();
                ok(true);
            }
        });
    });

    asyncTest("multiple loading of iframe triggers one refresh per load", function() {
        var triggers = 0;
        var first = true;
        var timeout = setTimeout(start, 4000);

        var dialog = createWindow({
            content: "/base/tests/window/blank.html",
            iframe: true,
            refresh: function() {
                triggers++;

                if (first) {
                    dialog.refresh("blank.html?v2");
                    first = false;
                } else {
                    start();
                    clearTimeout(timeout);
                    equal(triggers, 2);
                }
            }
        });
    });

    test("clicking the refresh button on a static window triggers refresh event", function() {
        var triggers = 0,
            dialog = createWindow({
                actions: ["Refresh"],
                refresh: function() {
                    triggers++;
                }
            });

        dialog.wrapper.find(".k-i-refresh").trigger("click");

        equal(triggers, 1);
    });

    test("clicking the close button triggers close event", function() {
        var triggers = 0,
            dialog = createWindow({
                close: function() {
                    ok(true);
                }
            });

        dialog.wrapper.find(".k-i-close").trigger("click");
    });

    test("clicking the close button triggers close event when default is prevented", 2, function() {
        var triggers = 0,
            dialog = createWindow({
                animation: false,
                close: function(ev) {
                    ok(true);
                    ev.preventDefault();
                }
            });

        dialog.wrapper.find(".k-i-close").trigger("click");
        dialog.wrapper.find(".k-i-close").trigger("click");
    });

    test("minimize triggers minimize event", function() {
        var triggers = 0,
            dialog = createWindow({
                actions: ["Minimize", "Restore"],
                minimize: function() {
                    triggers++;
                }
            });

        dialog.wrapper.find(".k-i-window-minimize").trigger("click");

        equal(triggers, 1);
    });

    test("maximize triggers maximize event", function() {
        var triggers = 0,
            dialog = createWindow({
                actions: ["Maximize", "Restore"],
                maximize: function() {
                    triggers++;
                }
            });

        dialog.wrapper.find(".k-i-window-maximize").trigger("click");

        equal(triggers, 1);
    });

    asyncTest("error event gets triggered with proper information", function() {
        var dialog = createWindow({
                error: function(e) {
                    ok(e);
                    equal(e.status, "error");
                    equal(e.xhr.status, 404);
                    start();
                }
            });

        $.mockjaxSettings.responseTime = 0;
        $.mockjax({
            url: "/foo",
            status: 404,
            responseText: "Foo not found"
        });

        dialog.refresh("/foo");
    });

    test("moving minimized window does not show drag handles", function() {
        var dialog = createWindow();

        dialog.minimize();

        dialog.dragging.dragend({
            currentTarget: dialog.wrapper
        });

        equal(dialog.wrapper.find(".k-resize-handle").css("display"), "none");
    });

    test("moving minimized window does not show drag handles", function() {
        var dialog = createWindow();

        dialog.minimize();

        dialog.initialWindowPosition = { top: 0, left: 0 };

        dialog.dragging.dragcancel({
            currentTarget: dialog.wrapper
        });

        equal(dialog.wrapper.find(".k-resize-handle").css("display"), "none");
    });

    test("destroy can be called in close event", function() {
        var dialog = createWindow({
            close: function() {
                this.destroy();
            }
        });

        dialog.close();

        ok(true);
    });

    var keys;

    module("keyboard support", {
        setup: function() {
            keys = kendo.keys;

            $.fn.press = function(key, options) {
                return this.trigger($.extend({ type: "keydown", keyCode: key }, options ));
            };
        },
        teardown: function() {
            QUnit.fixture.closest("body").find(".k-window-content").each(function(idx, element){
                $(element).data("kendoWindow").destroy();
            });
            QUnit.fixture.closest("body").find(".k-overlay").remove();
            $.mockjax.clear();
        }
    });

    test("escape key triggers close event", 2, function() {
        var triggers = 0;

        var dialog = createWindow({
            close: function(e) {
                ok(true);
                ok(e.userTriggered);
            }
        });

        dialog.element.press(keys.ESC);
    });

    test("escape key on minimized Window triggers close event", 2, function() {
        var triggers = 0;

        var dialog = createWindow({
            close: function(e) {
                ok(true);
                ok(e.userTriggered);
            }
        });

        dialog.minimize();

        dialog.wrapper.press(keys.ESC);
    });

    test("hitting escape in closing window does not trigger new close", function() {
        var calls = 0;

        var dialog = createWindow({
            close: function() {
                calls++;
            },
            animation: { close: { duration: 50 } }
        });

        dialog.element.press(keys.ESC).press(keys.ESC);

        equal(calls, 1);
    });

    test("up arrow moves window up", function() {
        var dialogObject = createWindow({});
        var dialog = dialogObject.element;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.UP);

        QUnit.close(dialogObject.wrapper.offset().top, offset.top - 10, 1);
    });

    test("down arrow moves window down", function() {
        var dialogObject = createWindow({});
        var dialog = dialogObject.element;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.DOWN);

        QUnit.close(dialogObject.wrapper.offset().top, offset.top + 10, 1);
    });

    test("left arrow moves window left", function() {
        var dialogObject = createWindow({});
        var dialog = dialogObject.element;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.LEFT);

        equal(dialogObject.wrapper.offset().left, offset.left - 10);
    });

    test("right arrow moves window right", function() {
        var dialogObject = createWindow({});
        var dialog = dialogObject.element;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.RIGHT);

        equal(dialogObject.wrapper.offset().left, offset.left + 10);
    });

    test("up arrow moves minimized window up", function() {
        var dialogObject = createWindow({});
        dialogObject.minimize()
        var dialog = dialogObject.wrapper;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.UP);

        QUnit.close(dialogObject.wrapper.offset().top, offset.top - 10, 1);
    });

    test("down arrow moves minimized window down", function() {
        var dialogObject = createWindow({});
        dialogObject.minimize()
        var dialog = dialogObject.wrapper;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.DOWN);

        QUnit.close(dialogObject.wrapper.offset().top, offset.top + 10, 1);
    });

    test("left arrow moves minimized window left", function() {
        var dialogObject = createWindow({});
        dialogObject.minimize()
        var dialog = dialogObject.wrapper;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.LEFT);

        equal(dialogObject.wrapper.offset().left, offset.left - 10);
    });

    test("right arrow moves minimized window right", function() {
        var dialogObject = createWindow({});
        dialogObject.minimize()
        var dialog = dialogObject.wrapper;

        var offset = dialogObject.wrapper.offset();

        dialog.press(keys.RIGHT);

        equal(dialogObject.wrapper.offset().left, offset.left + 10);
    });


    test("ctrl+down arrow expands window", function() {
        var dialogObject = createWindow({ height: 200 });
        var dialog = dialogObject.element;

        dialog.press(keys.DOWN, { ctrlKey: true });

        equal(dialogObject.wrapper.height(), 210);
    });

    test("ctrl+up arrow shrinks window", function() {
        var dialogObject = createWindow({ height: 200 });
        var dialog = dialogObject.element;

        dialog.press(keys.UP, { ctrlKey: true });

        equal(dialogObject.wrapper.height(), 190);
    });

    test("ctrl+left arrow shrinks window", function() {
        var dialogObject = createWindow({ width: 200 });
        var dialog = dialogObject.element;

        dialog.press(keys.LEFT, { ctrlKey: true });

        equal(dialogObject.wrapper.width(), 190);
    });

    test("ctrl+right arrow expands window", function() {
        var dialogObject = createWindow({ width: 200 });
        var dialog = dialogObject.element;

        dialog.press(keys.RIGHT, { ctrlKey: true });

        equal(dialogObject.wrapper.width(), 210);
    });

    test("ctrl+left takes minWidth into account", function() {
        var dialogObject = createWindow({
            width: 100,
            minWidth: 95
        });
        var dialog = dialogObject.element;

        dialog.press(keys.LEFT, { ctrlKey: true });

        equal(dialogObject.wrapper.width(), 95);
    });

    test("ctrl+right takes maxWidth into account", function() {
        var dialogObject = createWindow({
            width: 100,
            maxWidth: 105
        });
        var dialog = dialogObject.element;

        dialog.press(keys.RIGHT, { ctrlKey: true });

        equal(dialogObject.wrapper.width(), 105);
    });

    test("ctrl+up takes minHeight into account", function() {
        var dialogObject = createWindow({
            height: 100,
            minHeight: 95
        });
        var dialog = dialogObject.element;

        dialog.press(keys.UP, { ctrlKey: true });

        equal(dialogObject.wrapper.height(), 95);
    });

    test("ctrl+down takes maxHeight into account", function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;

        dialog.press(keys.DOWN, { ctrlKey: true });

        equal(dialogObject.wrapper.height(), 105);
    });

    test("alt+p toggles pin", 2, function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;

        dialog.press(80, { altKey: true });

        ok(dialogObject.options.pinned);

        dialog.press(80, { altKey: true });

        ok(!dialogObject.options.pinned);
    });

    test("alt+up maximizes the window", function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;

        dialog.press(keys.UP, { altKey: true });

        ok(dialogObject.isMaximized());
    });

    test("alt+down restores a maximized window", function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;
        dialogObject.maximize();
        dialog.press(keys.DOWN, { altKey: true });

        ok(!dialogObject.isMaximized());
    });

    test("alt+down minimizes window", function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;

        dialog.press(keys.DOWN, { altKey: true });

        ok(dialogObject.isMinimized());
    });

    test("alt+up restores a minimized window", function() {
        var dialogObject = createWindow({
            height: 100,
            maxHeight: 105
        });
        var dialog = dialogObject.element;
        dialogObject.minimize();
        dialog.press(keys.UP, { altKey: true });

        ok(!dialogObject.isMinimized());
    });

    asyncTest("alt+r triggers refresh event", 1, function() {
        var timeout = setTimeout(start, 2000);

        var dialogObject = createWindow({
            content: "/base/tests/window/blank.html",
            iframe: true,
        });

        dialogObject.one("refresh", function(){
            clearTimeout(timeout);
            start();
            ok(true);
        });

        dialogObject.element.press(82, { altKey: true });
    });

    test("resizing window with the keyboard updates widget options", 2, function() {
        var initialSize = 200,
            dialog = createWindow({ width: initialSize, height: initialSize });

        dialog.element.press(keys.RIGHT, { ctrlKey: true });
        dialog.element.press(keys.DOWN, { ctrlKey: true });

        equal(dialog.options.width, initialSize + 10 + "px");
        equal(dialog.options.height, initialSize + 10 + "px");
    });

    test("hitting arrow keys in nested input does not trigger keyboard support", function() {
        var dialogObject = createWindow({
            content: {
                template: "<input class='foo' />"
            }
        });
        var dialog = dialogObject.element;

        var offset = dialogObject.wrapper.offset();

        dialog.find("input").press(keys.UP);

        equal(dialogObject.wrapper.offset().top, offset.top);
    });

    test("hitting escape in a non-closable window does not close it", function() {
        var handler = spy();

        var dialogObject = createWindow({
            actions: ["custom"],
            close: handler
        });

        dialogObject.element.press(keys.ESC);

        ok(!handler.calls);
    });

    test("opening and closing modal Windows positions the modal overlay correctly over all other instances but one", function() {

        var win1 = createWindow({ modal: true, animate: false }),
            win2 = createWindow({ modal: true, animate: false }),
            win3 = createWindow({ modal: true, animate: false }),
            modalOverlay = QUnit.fixture.closest("body").children(".k-overlay");

        ok(modalOverlay.css("z-index") < win3.wrapper.css("z-index"));
        ok(modalOverlay.css("z-index") > win2.wrapper.css("z-index"));

        win3.close();

        ok(modalOverlay.css("z-index") < win2.wrapper.css("z-index"));
        ok(modalOverlay.css("z-index") > win1.wrapper.css("z-index"));
    });

    test("Resizing with keyboard raises resize event", 1, function() {
        var dialogObject = createWindow({
            resize: function() {
                ok(true);
            }
        });

        dialogObject.wrapper.children(".k-window-content").trigger({
            type: "keydown",
            keyCode: 40,
            ctrlKey: true
        });
    });

    test("resizeEnd event is triggered after resizing", function() {
        var handler = spy();
        var dialog = createWindow({
            resizeEnd: handler
        });

        dialog.resizing.dragend({
            currentTarget: dialog.wrapper
        });

        ok(handler.calls);
    });

    test("preventing resizeStart stops resizing", function() {
        var handler = spy();
        var dialog = createWindow({
            resizeStart: function(e){
                e.preventDefault();
            },
            resizeEnd: handler,
            resize: handler
        });

        dialog.resizing.dragstart();
        dialog.resizing.drag();
        dialog.resizing.dragend();

        ok(!dialog.resizing.initialPosition);
        ok(!handler.calls);
    });

    test("preventing dragstart stops dragging", function() {
        var handler = spy();
        var dialog = createWindow({
            dragstart: function(e){
                e.preventDefault();
            },
            dragend: handler
        });

        dialog.dragging.dragstart();
        dialog.dragging.dragend();

        ok(!dialog.initialWindowPosition);
        ok(!handler.calls);
    });
})();
