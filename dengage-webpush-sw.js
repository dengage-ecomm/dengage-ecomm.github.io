
var swUrl = new URL(location);
var accountId = swUrl.searchParams.get('account_id') || '';
var appGuid = swUrl.searchParams.get('app_guid') || '';
if (accountId && appGuid) {
    importScripts("https://pcdn.dengage.com/p/push/" + accountId + "/" + appGuid + "/dengage_sw.js");
}
        