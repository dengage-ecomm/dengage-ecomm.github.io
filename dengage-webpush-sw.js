(function () {
  'use strict';

  var appSettings = JSON.parse('{  "name": "dengage-ecomm.github.io",  "siteUrl": "https://dengage-ecomm.github.io/ ",  "autoShow": true,  "bellSettings": {    "size": "MEDIUM",    "location": "RIGHT",    "mainColor": "#1165f1",    "leftOffset": 0,    "accentColor": "#333333",    "dialogTitle": "",    "rightOffset": 0,    "bottomOffset": 0,    "advancedOptions": false,    "unsubscribeText": "",    "hideIfSubscribed": false,    "subscribeBtnText": "",    "unblockGuideText": "",    "subscribedTooltip": "",    "unsubscribeBtnText": "",    "nonSubscriberTooltip": "",    "afterSubscriptionText": "",    "unblockNotificationText": "",    "blockedSubscriberTooltip": ""  },  "slideSettings": {    "text": "We\'d like to show you notifications for the latest news and updates.",    "fixed": false,    "theme": "BOTTOM_BTNS",    "title": "",    "details": null,    "location": "TOP_CENTER",    "showIcon": true,    "mainColor": "#1165f1",    "showTitle": false,    "acceptBtnText": "Allow",    "cancelBtnText": "No Thanks",    "advancedOptions": false  },  "bannerSettings": {    "text": "",    "fixed": true,    "theme": "DEFAULT",    "details": null,    "location": "BOTTOM",    "showIcon": true,    "mainColor": "#333333",    "acceptBtnText": "Enable",    "advancedOptions": false  },  "defaultIconUrl": "https://w7.pngwing.com/pngs/789/777/png-transparent-computer-icons-tinyurl-hyperlink-symbol-url-shortening-chain-miscellaneous-text-technic.png",  "selectedPrompt": "NATIVE",  "autoShowSettings": {    "delay": 0,    "denyWaitTime": 0,    "promptAfterXVisits": 0,    "repromptAfterXMinutes": 0  },  "welcomeNotification": {    "link": "",    "title": "",    "enabled": false,    "message": ""  }}');

  /**
   * Service worker kullanarak, notifikasyon gösterir.
   * 
   * @param {object} data 
   * Gösterilecek notifikasyon ile ilgili bilgileri içerir
   * { title, iconUrl, message, mediaUrl, badgeUrl, targetUrl }
   * 
   * @param {object} registration
   * serviceWorker registration objesi.
   * 
   * Geriye promise döndürür
   */

  function showNotificationWithSw(data, registration) {
    var title = data.title;
    var iconUrl = data.iconUrl == 'default_icon' ? appSettings.defaultIconUrl : (data.iconUrl || '').trim();
    var options = {
      body: data.message,
      requireInteraction:  false ,
      data: {
        targetUrl: data.targetUrl,
        messageId: data.messageId,
        messageDetails: data.messageDetails
      }
    };

    if (data.mediaUrl) {
      options.image = data.mediaUrl;
    }

    if (iconUrl) {
      options.icon = iconUrl;
    }

    if (data.badgeUrl) {
      options.badge = data.badgeUrl;
    }

    if (data.actionButtons && data.actionButtons.length) {
      options.actions = [];
      var actions = data.actionButtons;

      for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
        options.actions[actionIndex] = {
          action: actions[actionIndex].id,
          title: actions[actionIndex].text
        };

        if (actions[actionIndex].icon) {
          options.actions[actionIndex].icon = actions[actionIndex].icon;
        }
      }

      options.data.actionButtons = actions;
    }

    return registration.showNotification(title, options);
  }
  /**
   * Notification click edildiğinde target URL açar ve open sinyali gönderir
   * 
   * @param {object} event 
   * Click event'i içerisinde notification objesini ve action değerini barındırır
   */

  function handleNotificationClick(event) {
    // Android doesn't close the notification when you click on it  
    // See: http://crbug.com/463146  
    console.log('notificationclick');
    console.log(event.notification);
    event.notification.close();
    var windowOpenPromise = Promise.resolve();
    var sendOpenPromise = Promise.resolve();
    var action = (event.notification.data.actionButtons || []).find(function (b) {
      return b.id == event.action;
    });

    if (event.action && action) {
      if (action.targetUrl) {
        windowOpenPromise = clients.openWindow(action.targetUrl);
      }

      if (event.notification.data.messageId != null) {
        sendOpenPromise = sendOpen(event.notification.data.messageId, event.notification.data.messageDetails, action.id);
      }
    } else if (event.notification.data.targetUrl) {
      windowOpenPromise = clients.openWindow(event.notification.data.targetUrl);

      if (event.notification.data.messageId != null) {
        sendOpenPromise = sendOpen(event.notification.data.messageId, event.notification.data.messageDetails);
      }
    }

    event.waitUntil(Promise.all([windowOpenPromise, sendOpenPromise]));
  }

  function sendOpen(messageId, messageDetails, buttonId) {
    var data = {
      integrationKey: "CdiRrm_s_l_YyKCmXzc1VUEgxHW9ggiUPceVuInq3FA1aHuhwQOgwvuJtuicHgn1RDTOYQmMLMge_s_l_s7QmVyQCNccaceBs_p_l_9pZFkttqxvO4e39Z8djbwmnsaqN2JWq_p_l_GM5lIF",
      messageId: messageId,
      messageDetails: messageDetails,
      buttonId: buttonId || ''
    };
    return fetch('https://push.dengage.com/api/web/open', {
      method: 'POST',
      // *GET, POST, PUT, DELETE, etc.
      mode: 'cors',
      // no-cors, *cors, same-origin
      cache: 'no-cache',
      // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'omit',
      // include, *same-origin, omit
      headers: {
        'Content-Type': 'text/plain'
      },
      redirect: 'follow',
      // manual, *follow, error
      referrer: 'no-referrer',
      // no-referrer, *client
      body: JSON.stringify(data) // body data type must match "Content-Type" header

    });
  }

  self.addEventListener('install', function (event) {
    // burada eski service worker çalışıyor aslında
    event.waitUntil(self.skipWaiting());
  });
  self.addEventListener('activate', function (event) {
    // eski service worker gitti
    event.waitUntil(self.clients.claim());
  });
  self.addEventListener('push', function (event) {
    var data = event.data.json();
    console.log("[dengage-webpush-sw.js] Received message ", JSON.stringify(data));
    event.waitUntil(showNotificationWithSw(data, self.registration));
  });
  /*
  self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return;
    }

    var sendNotification = function(payload, icon, url) {
      var title = "Open Social";
      icon = icon || '/sites/default/files/images/touch/open-social.png';
      payload = payload || 'You\'ve received a message!';
      return self.registration.showNotification(title, {
        body: payload,
        icon: icon,
        data: url
      });
    };

    if (event.data) {
      var data = event.data.json();
      event.waitUntil(
        // Retrieve a list of the clients of this service worker.
        self.clients.matchAll().then(function(clientList) {
          // Check if there's at least one focused client.
          var focused = clientList.some(function(client) {
            return client.focused;
          });

          // The page is focused, don't show the notification.
          if (focused) {
            console.log('[SW] - Push received: ' + data.message);
            return true;
          }
          // The page is still open but unfocused, so focus the tab.
          else if (clientList.length > 0) {
            return sendNotification(data.message, data.icon, data.url);
          }
          // The page is closed, send a push to retain engagement.
          else {
            return sendNotification(data.message, data.icon, data.url);
          }
        })
      );
    }
  });
  */

  self.addEventListener('notificationclick', function (event) {
    handleNotificationClick(event);
  });
  /*self.addEventListener('pushsubscriptionchange', function(event) {
    //https://medium.com/@madridserginho/how-to-handle-webpush-api-pushsubscriptionchange-event-in-modern-browsers-6e47840d756f
  });*/

}());
