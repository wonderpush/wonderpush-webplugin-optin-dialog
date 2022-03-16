/**
 * WonderPush Web SDK plugin to present the user an opt-in dialog before prompting her for push permission.
 * @class OptinDialog
 * @param {external:WonderPushPluginSDK} WonderPushSDK - The WonderPush SDK instance provided automatically on intanciation.
 * @param {OptinDialog.Options} options - The plugin options.
 */
/**
 * @typedef {Object} OptinDialog.Options
 * @property {external:WonderPushPluginSDK.TriggersConfig} [triggers] - The triggers configuration for this plugin.
 * @property {string} [title] - The dialog title.
 * @property {string} [message] - The dialog message.
 * @property {string} [positiveButton] - The dialog positive button message.
 * @property {string} [negativeButton] - The dialog negative button message.
 * @property {string} [icon] - The dialog icon URL. Defaults to the default notification icon configured in the project.
 * @property {Object} [style] - Styles to be added to the dialog container.
 * @property {number|boolean} [closeSnooze=false] - How long to force to wait before presenting the dialog again, if the user clicks the close button.
 *                                                  Use `false` to not set any extra snooze, `true` to never present again, or give a duration in milliseconds.
 *                                                  Defaults to `false`, which relies on the SDK's default snooze of 12 hours without forcing extra snooze.
 * @property {number|boolean} [negativeSnooze=604800000] - How long to force to wait before presenting the dialog again, if the user clicks the close button.
 *                                                     Use `false` to ignore, `true` to never present again, or give a duration in milliseconds.
 *                                                     Defaults to 604800, 7 days.
 * @property {string} [positiveButtonBackgroundColor] - The hex color code of the positive button.
 * @property {string} [negativeButtonBackgroundColor] - The hex color code of the negative button.
 * @property {string} [positiveButtonTextColor] - The hex color code of the positive button.
 * @property {string} [negativeButtonTextColor] - The hex color code of the negative button.
 * @property {string} [backgroundColor] - The hex color code of the dialog background.
 * @property {string} [textColor] - The hex color code of the dialog text.
 */
/**
 * The WonderPush JavaScript SDK instance.
 * @external WonderPushPluginSDK
 * @see {@link https://wonderpush.github.io/wonderpush-javascript-sdk/latest/WonderPushPluginSDK.html|WonderPush JavaScript Plugin SDK reference}
 */
/**
 * WonderPush SDK triggers configuration.
 * @typedef TriggersConfig
 * @memberof external:WonderPushPluginSDK
 * @see {@link https://wonderpush.github.io/wonderpush-javascript-sdk/latest/WonderPushPluginSDK.html#.TriggersConfig|WonderPush JavaScript Plugin SDK triggers configuration reference}
 */
WonderPush.registerPlugin("optin-dialog", function OptinDialog(WonderPushSDK, options) {

  // Do not show anything on unsupported browsers.
  if (!WonderPushSDK.isNativePushNotificationSupported()) {
    return {
      showDialog: function() {},
      hideDialog: function() {},
    };
  }

  var translations = {
    "fr": {
      "Would you like to subscribe to push notifications?": "Souhaitez-vous vous inscrire aux notifications?",
      "You can always unsubscribe at any time.": "Vous pouvez vous désinscrire à tout moment.",
      "Subscribe": "Je m'inscris",
      "Later": "Plus tard",
      "Web push by WonderPush": "Push web par WonderPush",
    },
    "es": {
      "Would you like to subscribe to push notifications?": "¿Desea suscribirse a las notificaciones push?",
      "You can always unsubscribe at any time.": "Siempre puede darse de baja en cualquier momento",
      "Subscribe": "Me suscribo",
      "Later": "Más tarde",
      "Web push by WonderPush": "Push web por WonderPush",
    },
    "it": {
      "Would you like to subscribe to push notifications?": "Vuoi iscriverti alle notifiche push?",
      "You can always unsubscribe at any time.": "Puoi annullare l'iscrizione in qualsiasi momento",
      "Subscribe": "Mi iscrivo",
      "Later": "Più tardi",
      "Web push by WonderPush": "Push web di WonderPush",
    },
    "de": {
      "Would you like to subscribe to push notifications?": "Möchten Sie Push-Benachrichtigungen abonnieren?",
      "You can always unsubscribe at any time.": "Sie können sich jederzeit abmelden.",
      "Subscribe": "Register",
      "Later": "Später",
      "Web push by WonderPush": "Web push von WonderPush",
    },
    "pt": {
      "Would you like to subscribe to push notifications?": "Deseja se inscrever para receber notificações?",
      "You can always unsubscribe at any time.": "Você pode cancelar a qualquer momento.",
      "Subscribe": "Register",
      "Later": "Mais tarde",
      "Web push by WonderPush": "Push web da WonderPush",
    },
    "nl": {
      "Would you like to subscribe to push notifications?": "Wilt u zich abonneren op pushmeldingen?",
      "You can always unsubscribe at any time.": "U kunt zich altijd op elk gewenst moment afmelden.",
      "Subscribe": "Abonneren",
      "Later": "Later",
    },
    "pl": {
      "Would you like to subscribe to push notifications?": "Czy chcesz subskrybować powiadomienia push?",
      "You can always unsubscribe at any time.": "Zawsze możesz zrezygnować z subskrypcji w dowolnym momencie.",
      "Subscribe": "Subskrybuj",
      "Later": "Później",
    },
  };
  var locales = WonderPushSDK.getLocales ? WonderPushSDK.getLocales() || [] : [];
  var language = locales.map(function(x) { return x.split(/[-_]/)[0]; })[0] || (navigator.language || '').split('-')[0];

  /**
   * Translates the given text
   * @param text
   * @returns {*}
   */
  var _ = function (text) {
    if (translations.hasOwnProperty(language) && translations[language][text]) return translations[language][text];
    return text;
  };

  var _title = options.title !== undefined ? options.title : _('Would you like to subscribe to push notifications?');
  var _message = options.message !== undefined ? options.message : _('You can always unsubscribe at any time.');
  var _positiveButton = options.positiveButton || _("Subscribe");
  var _negativeButton = options.negativeButton || _("Later");
  var _style = options.style;
  var _icon = options.icon !== undefined ? options.icon : WonderPushSDK.getNotificationIcon();
  var _hidePoweredBy = !!options.hidePoweredBy;
  var _closeSnooze = options.closeSnooze !== undefined ? options.closeSnooze : false;
  var _negativeSnooze = options.negativeSnooze !== undefined ? options.negativeSnooze : 604800000;

  var _triggers = options.triggers;

  WonderPushSDK.loadStylesheet('style.css');

  var _registrationInProgress = false;

  var _hideDialogEventSource;
  var _hideDialog;

  if (WonderPushSDK.waitTriggers) { // WonderPush SDK 1.1.18.0 or above
    WonderPushSDK.waitTriggers(_triggers).then(function() {
      this.showDialog();
    }.bind(this));
  } else {
    WonderPushSDK.checkTriggers(_triggers, function() {
      this.showDialog();
    }.bind(this));
  }

  /**
   * Hides the dialog.
   * @function
   * @memberof! OptinDialog.prototype
   * @fires OptinDialog#event:"wonderpush-webplugin-optin-dialog.hide"
   */
  this.hideDialog = function() {
    if (_hideDialog) {
      /**
       * Hide event.
       *
       * This event bubbles and is cancelable.
       * @event OptinDialog#event:"wonderpush-webplugin-optin-dialog.hide"
       */
      if (_hideDialogEventSource.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.hide', {bubbles: true, cancelable: true}))) {
        _hideDialog();
        _registrationInProgress = false;
        _hideDialog = undefined;
        _hideDialogEventSource = undefined;
      }
    }
  }.bind(this);

  /**
   * Shows the dialog.
   * @function
   * @memberof! OptinDialog.prototype
   * @fires OptinDialog#event:"wonderpush-webplugin-optin-dialog.show"
   */
  this.showDialog = function() {
    var that = this;
    if (_registrationInProgress) {
      WonderPushSDK.logDebug('Registration already in progress');
      return;
    }

    // Do not show when user already subscribed, denied permission or doesn't support subscription
    if (window.WonderPush) {
      var subscriptionState = window.WonderPush.Notification.getSubscriptionState();
      if (subscriptionState === window.WonderPush.SubscriptionState.SUBSCRIBED
        || subscriptionState === window.WonderPush.SubscriptionState.UNSUPPORTED
        || subscriptionState === window.WonderPush.SubscriptionState.DENIED) {
        return;
      }
    }

    _registrationInProgress = true;
    var cssPrefix = 'wp-optin-dialog-';

    var boxDiv = document.createElement('div');
    boxDiv.className = cssPrefix + 'container';
    if (options.backgroundColor) {
      boxDiv.style.backgroundColor = options.backgroundColor;
      boxDiv.style.backgroundImage = 'none';
      boxDiv.style.borderColor = options.backgroundColor;
    }
    boxDiv.style.color = options.textColor || 'black';
    if (_style) {
      for (var key in _style) {
        boxDiv.style[key] = _style[key];
      }
    }

    _hideDialog = function() {
      // Note: boxDiv could have been moved out of BODY under another node
      //       hence use boxDiv.parentNode instead of document.body.
      boxDiv.parentNode.removeChild(boxDiv);
    };
    _hideDialogEventSource = boxDiv;

    var bodyDiv = document.createElement('div');
    bodyDiv.className = cssPrefix+'body';
    boxDiv.appendChild(bodyDiv);

    if (_icon) {
      var iconDiv = document.createElement('div');
      iconDiv.className = cssPrefix+'icon';
      iconDiv.style.backgroundImage = "url(" + _icon.replace('(', '%28').replace(')', '%29') + ")";
      bodyDiv.appendChild(iconDiv);
    }

    var textDiv = document.createElement('div');
    textDiv.className = cssPrefix+'text';
    bodyDiv.appendChild(textDiv);
    if (_title) {
      var titleDiv = document.createElement('div');
      titleDiv.className = cssPrefix+'title';
      titleDiv.innerHTML = _title;
      textDiv.appendChild(titleDiv);
    }
    if (_message) {
      var messageDiv = document.createElement('div');
      messageDiv.className = cssPrefix+'message';
      messageDiv.innerHTML = _message;
      textDiv.appendChild(messageDiv);
    }

    var buttonsDiv = document.createElement('div');
    buttonsDiv.className = cssPrefix+'buttons';
    boxDiv.appendChild(buttonsDiv);
    if (!_hidePoweredBy) {
      var poweredByLink = document.createElement('a');
      poweredByLink.innerHTML = _("Web push by WonderPush");
      poweredByLink.href = "https://docs.wonderpush.com/docs/manage-your-data-and-unsubscribe-from-web-push-notifications";
      poweredByLink.className = cssPrefix+'powered-by';
      poweredByLink.setAttribute('title', 'Web and mobile push notifications');
      buttonsDiv.appendChild(poweredByLink);
    }

    var btnConfig = {
      positiveButton: {
        label: _positiveButton,
        backgroundColor: options.positiveButtonBackgroundColor || undefined,
        color: options.positiveButtonTextColor || undefined,
        click: function(event) {
          /**
           * Positive button click event.
           *
           * This event bubbles and is cancelable.
           * @event OptinDialog#event:"wonderpush-webplugin-optin-dialog.positiveButton.click"
           */
          if (event.target.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.positiveButton.click', {bubbles: true, cancelable: true}))) {
            WonderPushSDK.subscribeToNotifications(event);
            that.hideDialog();
          }
        },
      },
      negativeButton: {
        label: _negativeButton,
        backgroundColor: options.negativeButtonBackgroundColor || undefined,
        color: options.negativeButtonTextColor || undefined,
        click: function(event) {
          if (_negativeSnooze !== undefined && _negativeSnooze !== false && WonderPushSDK.snoozeTriggers) WonderPushSDK.snoozeTriggers(_negativeSnooze);
          /**
           * Negative button click event.
           *
           * This event bubbles and is cancelable.
           * @event OptinDialog#event:"wonderpush-webplugin-optin-dialog.negativeButton.click"
           */
          if (event.target.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.negativeButton.click', {bubbles: true, cancelable: true}))) {
            that.hideDialog();
          }
        },
      },
    };

    var btns = ['negativeButton', 'positiveButton'];
    btns.forEach(function(btn) {
      var link = document.createElement('a');
      link.href = '#';
      link.className = cssPrefix+'button '+cssPrefix+btn;
      if (btnConfig[btn].backgroundColor) {
        link.style.backgroundColor = btnConfig[btn].backgroundColor;
        link.style.backgroundImage = 'none';
        link.style.borderColor = btnConfig[btn].backgroundColor;
      }
      if (btnConfig[btn].color) {
        link.style.color = btnConfig[btn].color;
      }
      link.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        btnConfig[btn].click(event);
      });
      buttonsDiv.appendChild(link);
      var label = document.createElement('label');
      label.innerHTML = btnConfig[btn].label;
      link.appendChild(label);
    });

    var closeButton = document.createElement('a');
    boxDiv.appendChild(closeButton);
    closeButton.href = '#';
    closeButton.className = cssPrefix+'close';
    closeButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (_closeSnooze !== undefined && _closeSnooze !== false && WonderPushSDK.snoozeTriggers) WonderPushSDK.snoozeTriggers(_closeSnooze);
      /**
       * Close button click event.
       *
       * This event bubbles and is cancelable.
       * @event OptinDialog#event:"wonderpush-webplugin-optin-dialog.closeButton.click"
       */
      if (event.target.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.closeButton.click', {bubbles: true, cancelable: true}))) {
        that.hideDialog();
      }
    });

    /**
     * Show event.
     *
     * This event bubbles and is cancelable.
     * @event OptinDialog#event:"wonderpush-webplugin-optin-dialog.show"
     */
    if (document.body.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.show', {bubbles: true, cancelable: true}))) {
      document.body.appendChild(boxDiv);
    } else {
      _registrationInProgress = false;
      _hideDialog = undefined;
      _hideDialogEventSource = undefined;
    }
  }.bind(this);

});
