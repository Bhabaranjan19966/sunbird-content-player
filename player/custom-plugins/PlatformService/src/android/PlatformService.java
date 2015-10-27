import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import android.util.Log;
import android.provider.Settings;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

public class PlatformService extends CordovaPlugin {
    public static final String TAG = "Platform Service Plugin";
    Map<String, Map<String, Object>> contentMap;
    /**
     * Constructor.
     */
    public PlatformService() {
        contentMap = new HashMap<String, Map<String, Object>>();
    }
        /**
         * Sets the context of the Command. This can then be used to do things like
         * get file paths associated with the Activity.
         *
         * @param cordova The context of the main Activity.
         * @param webView The CordovaWebView Cordova is running in.
         */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Log.v(TAG, "Init PlatformService");
    }
    public boolean execute(final String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.v(TAG, "PlatformService received:" + action);
        if(action.equals("showToast")) {
            showToast(args.getString(0), Toast.LENGTH_SHORT);
            callbackContext.success(args.getString(0));
        } else if(action.equals("getContentList")) {
            JSONObject contentList = getContentList(args);
            callbackContext.success(contentList);
        } else if(action.equals("setAPIEndpoint")) {
            String endpoint = args.getString(0);
            setAPIEndpoint(endpoint);
            callbackContext.success(endpoint);
        }
        return true;
    }

    private void setAPIEndpoint(String endpoint) {
        RESTUtil.setAPIEndpoint(endpoint);
    }

    private void showToast(final String message, final int duration) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                Toast toast = Toast.makeText(cordova.getActivity().getApplicationContext(), message, duration);
                toast.show();
            }
        });
    }

    private JSONObject getContentList(JSONArray params) {
        JSONObject obj = new JSONObject();
        try {
            Map<String, JSONObject> result = new HashMap<String, JSONObject>();
            if(null != params && params.length() > 0) {
                String strParam = params.getString(0);
                JSONObject jsonObj = new JSONObject(strParam);
                JSONArray types = jsonObj.getJSONArray("types");
                JSONObject filterJSON = jsonObj.getJSONObject("filter");
                String filter = null;
                if (null != filterJSON) {
                    filter = filterJSON.toString();
                }
                if(null != types && types.length() > 0) {
                    for(int i=0;i<types.length();i++) {
                        String type = types.getString(i);
                        Map<String, Object> contentObj = getContent(type, filter);
                        if (null != contentObj) {
                            JSONObject contentJSONObj = new JSONObject(contentObj);
                            result.put(type, contentJSONObj);
                        }
                    }
                }
            }
            obj = new JSONObject(result);
            return obj;
        } catch(Exception e) {
        }
        return obj;
    }

    private Map<String, Object> getContent(String type, String filter) {
        Map<String, Object> content = contentMap.get(type);
        if(content == null || content.get("status") == "error") {
            String request = "{\"request\": {}}";
            if (null != filter && filter.trim().length() > 0) {
                request = "{\"request\": " + filter + "}";
            }
            content = RESTUtil.post("/v1/content/list?type="+type, request);
            contentMap.put(type, content);
        }
        return content;
    }
}
