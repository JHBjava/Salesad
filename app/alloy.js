// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};
Alloy.Globals.Map = require('ti.map');
var GA = require('analytics.google');
Alloy.Globals.tracker = GA.getTracker("UA-53651461-1");

/** include required file**/
var API = require('api');
var COMMON = require('common');
var isNotification = Ti.App.Properties.getString('notification'); 
if(isNotification === null){
	Ti.App.Properties.setString('notification', "1");
}

var Cloud = require('ti.cloud');
 
Cloud.Users.login({
    login: 'geomilano',
    password: '123456'
}, function (e) {
	if (e.success) {
		var user = e.users[0];
		//console.log(e);
    } else {
    	// alert('B Error: ' + JSON.stringify(e));
      //  alert("Error :"+e.message);
    }
});

// Process incoming push notifications
function receivePush(e) {
	var params = e.data.extra; 
	result = params.split("_"); 
	if(result.length > 1){	
		Ti.App.fireEvent('app:goToAds', {m_id: result[0],a_id: result[1], isFeed : 1 });
	}else{ 
		Ti.App.fireEvent('app:goToAds', {m_id: result[0], a_id: "", isFeed : 1});
	}
	return false;
}
function deviceTokenSuccess(e) {
    deviceToken = e.deviceToken;
    Cloud.PushNotifications.subscribe({
			    channel: 'sales',
			    type:'ios',
			    device_token: deviceToken
			}, function (e) {
				console.log(e);
			    if (e.success) {
			    	alert('Success : ' + deviceToken);
			    	/** User device token**/
	         		Ti.App.Properties.setString('deviceToken', deviceToken);
			     	
					API.updateNotificationToken();
			    } else {
			    //	alert('Success Error: ' + deviceToken);
			        registerPush();
			    }
			});
}
function deviceTokenError(e) {
    alert('Failed to register for push notifications! ' + e.error);
}

function registerPush(){
	if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {
 
 // Wait for user settings to be registered before registering for push notifications
    Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {
 
 // Remove event listener once registered for push notifications
        Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush); 
 
        Ti.Network.registerForPushNotifications({
            success: deviceTokenSuccess,
            error: deviceTokenError,
            callback: receivePush
        });
    });
 
 // Register notification types to use
    Ti.App.iOS.registerUserNotificationSettings({
	    types: [
            Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
            Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
            Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
        ]
    });
}else{
	Titanium.Network.registerForPushNotifications({
	    types: [
	        Titanium.Network.NOTIFICATION_TYPE_BADGE,
	        Titanium.Network.NOTIFICATION_TYPE_ALERT,
	        Titanium.Network.NOTIFICATION_TYPE_SOUND
	    ],
		success:deviceTokenSuccess,
		error:deviceTokenError,
		callback:receivePush
	});
	
}
 
	
}

Titanium.UI.iPhone.setAppBadge("0");

var Utils = {
  /* modified version of https://gist.github.com/1243697 */
  _getExtension: function(fn) {
    // from http://stackoverflow.com/a/680982/292947
    var re = /(?:\.([^.]+))?$/;
    var tmpext = re.exec(fn)[1];
    return (tmpext) ? tmpext : '';
  },
  RemoteImage: function(a){
    a = a || {};
    var md5;
    var needsToSave = false;
    var savedFile;
    if(a.image){
      md5 = Ti.Utils.md5HexDigest(a.image)+this._getExtension(a.image);
      savedFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,md5);
      if(savedFile.exists()){
        a.image = savedFile;
      } else {
        needsToSave = true;
      }
    }
    var image = Ti.UI.createImageView(a);
    if(needsToSave === true){
      function saveImage(e){
        image.removeEventListener('load',saveImage);
        savedFile.write(
          Ti.UI.createImageView({image:image.image,width:'auto',height:'auto'}).toImage()
        );
      }
      image.addEventListener('load',saveImage);
    }
    return image;
  }
};
 registerPush();
 
function currentDateTime(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; 
	var yyyy = today.getFullYear();
	
	var hours = today.getHours();
	var minutes = today.getMinutes();
	var sec = today.getSeconds();
	if (minutes < 10){
		minutes = "0" + minutes;
	} 
	if (sec < 10){
		sec = "0" + sec;
	} 
	if(dd<10) {
	    dd='0'+dd;
	} 
	
	if(mm<10) {
	    mm='0'+mm;
	} 
	
	datetime = yyyy+'-'+mm+'-'+dd + " "+ hours+":"+minutes+":"+sec;
	return datetime ;
}