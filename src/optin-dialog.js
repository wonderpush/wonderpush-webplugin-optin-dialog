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

  this.title = options.title !== undefined ? options.title : 'Would you like to subscribe to push notifications?';
  this.message = options.message !== undefined ? options.message : 'You can always unsubscribe at any time.';
  this.positiveButton = options.positiveButton || "Subscribe";
  this.negativeButton = options.negativeButton || "Later";
  this.style = options.style;
  this.icon = options.icon !== undefined ? options.icon : WonderPushSDK.getNotificationIcon();
  this.hidePoweredBy = !!options.hidePoweredBy;

  this.triggers = options.triggers;

  WonderPushSDK.loadStylesheet('style.css');

  this.registrationInProgress = false;

  var _hideDialogEventSource = undefined;
  var _hideDialog = undefined;

  WonderPushSDK.checkTriggers(this.triggers, function() {
    this.showDialog();
  }.bind(this));

  /**
   * Hides the dialog.
   * @function
   * @memberof! OptinDialog.prototype
   */
  this.hideDialog = function() {
    if (_hideDialog) {
      if (_hideDialogEventSource.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.hide', {bubbles: true, cancelable: true}))) {
        _hideDialog();
        this.registrationInProgress = false;
        _hideDialog = undefined;
        _hideDialogEventSource = undefined;
      }
    }
  }.bind(this);

  /**
   * Shows the dialog.
   * @function
   * @memberof! OptinDialog.prototype
   */
  this.showDialog = function() {
    var that = this;
    if (this.registrationInProgress) {
      WonderPushSDK.logDebug('Registration already in progress');
      return;
    }

    this.registrationInProgress = true;
    var cssPrefix = 'wp-optin-dialog-';

    var boxDiv = document.createElement('div');
    boxDiv.className = cssPrefix + 'container';
    if (this.style) {
      for (var key in this.style) {
        boxDiv.style[key] = this.style[key];
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

    if (this.icon) {
      var iconDiv = document.createElement('div');
      iconDiv.className = cssPrefix+'icon';
      iconDiv.style.backgroundImage = "url(" + this.icon + ")";
      bodyDiv.appendChild(iconDiv);
    }

    var textDiv = document.createElement('div');
    textDiv.className = cssPrefix+'text';
    bodyDiv.appendChild(textDiv);
    if (this.title) {
      var titleDiv = document.createElement('div');
      titleDiv.className = cssPrefix+'title';
      titleDiv.textContent = this.title;
      textDiv.appendChild(titleDiv);
    }
    if (this.message) {
      var messageDiv = document.createElement('div');
      messageDiv.className = cssPrefix+'message';
      messageDiv.textContent = this.message;
      textDiv.appendChild(messageDiv);
    }

    var buttonsDiv = document.createElement('div');
    buttonsDiv.className = cssPrefix+'buttons';
    boxDiv.appendChild(buttonsDiv);
    if (!this.hidePoweredBy) {
      var poweredByLink = document.createElement('a');
      poweredByLink.textContent = "Powered by WonderPush";
      poweredByLink.href = "https://www.wonderpush.com/";
      poweredByLink.className = cssPrefix+'powered-by';
      buttonsDiv.appendChild(poweredByLink);
    }

    var btnConfig = {
      positiveButton: {
        click: function(event) {
          if (event.target.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.positiveButton.click', {bubbles: true, cancelable: true}))) {
            WonderPushSDK.setNotificationEnabled(true, event);
            that.hideDialog();
          }
        },
      },
      negativeButton: {
        click: function(event) {
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
      link.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        btnConfig[btn].click(event);
      });
      buttonsDiv.appendChild(link);
      var label = document.createElement('label');
      label.textContent = this[btn];
      link.appendChild(label);
    }.bind(this));

    var closeButton = document.createElement('a');
    boxDiv.appendChild(closeButton);
    closeButton.href = '#';
    closeButton.className = cssPrefix+'close';
    closeButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.target.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.closeButton.click', {bubbles: true, cancelable: true}))) {
        that.hideDialog();
      }
    });

    if (document.body.dispatchEvent(new Event('wonderpush-webplugin-optin-dialog.show', {bubbles: true, cancelable: true}))) {
      document.body.appendChild(boxDiv);
    } else {
      this.registrationInProgress = false;
      _hideDialog = undefined;
      _hideDialogEventSource = undefined;
    }
  }.bind(this);

});
