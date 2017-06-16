WonderPush.registerPlugin("optin-dialog", function(WonderPushSDK, options) {

  this.title = options.title !== undefined ? options.title : 'Would you like to subscribe to push notifications?';
  this.message = options.message !== undefined ? options.message : 'You can always unsubscribe at any time.';
  this.positiveButton = options.positiveButton || "Subscribe";
  this.negativeButton = options.negativeButton || "Later";
  this.style = options.style;
  this.icon = options.icon !== undefined ? options.icon : WonderPushSDK.getNotificationIcon();

  this.triggers = options.triggers;

  WonderPushSDK.loadStylesheet('style.css');

  this.registrationInProgress = false;

  WonderPushSDK.checkTriggers(this.triggers, function() {
    this.showDialog();
  }.bind(this));

  this.showDialog = function() {
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
    var poweredByLink = document.createElement('a');
    poweredByLink.textContent = "Powered by WonderPush";
    poweredByLink.href = "https://www.wonderpush.com/";
    poweredByLink.className = cssPrefix+'powered-by';
    buttonsDiv.appendChild(poweredByLink);

    var btnConfig = {
      positiveButton: {
        click: function(event) {
          WonderPushSDK.setNotificationEnabled(true, event);
          stopRegistration();
        },
      },
      negativeButton: {
        click: function(event) {
          stopRegistration();
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
      stopRegistration();
    });

    var container = window.document.body;
    container.appendChild(boxDiv);
    var stopRegistration = function() {
      container.removeChild(boxDiv);
      this.registrationInProgress = false;
    }.bind(this);
  }.bind(this);

});
