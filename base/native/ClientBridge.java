import android.annotation.SuppressLint;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
//游戏端调用桥接类
public class ClientBridge {
    @SuppressLint("StaticFieldLeak")
    private static AppActivity activity;

    public void init(final AppActivity activity) {
        ClientBridge.activity = activity;
    }

    public static void onCall(String type, String args) {
        switch (type){
            case "login":
                login();
                break;
            case "pay":
                pay(args);
                break;
            case "play":
                play(args);
                break;
        }
    }

    private static void callback(final String type, final String args){
        activity.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                String r = String.format("onNativeCallback('%s','%s')", type, args);
                Cocos2dxJavascriptJavaBridge.evalString(r);
            }
        });
    }

    //登陆
    private static void login() {

    }

    //支付
    private static void pay(String args) {

    }

    //播放视频
    private static void play(String args) {

    }
}
