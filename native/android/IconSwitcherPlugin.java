package hu.shadowarts.app;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.List;

/**
 * Natív launcher-ikon váltó plugin.
 *
 * Az Android nem engedi a valódi launcher ikon futásidejű cseréjét,
 * de az ún. "activity-alias" trükkel elérhető, hogy több előre definiált
 * ikon variáns közül választhassunk: mindegyik alias ugyanarra a
 * MainActivity-re mutat, de saját ikonnal rendelkezik, és egyszerre csak
 * egy van engedélyezve (PackageManager.setComponentEnabledSetting).
 *
 * Az 5 alias neve (lásd AndroidManifest.xml):
 *   .IconAmber, .IconSlate, .IconForest, .IconRose, .IconNight
 *
 * A DONT_KILL_APP flag miatt az alkalmazás nem áll le váltáskor,
 * de a launcher (kezdőképernyő) ikonja csak a következő megnyitáskor
 * vagy a launcher cache frissülésekor jelenik meg ténylegesen újként —
 * ez Android rendszerszintű korlátozás, nem hiba.
 */
@CapacitorPlugin(name = "IconSwitcher")
public class IconSwitcherPlugin extends Plugin {

    private static final List<String> THEME_IDS = Arrays.asList(
            "amber", "slate", "forest", "rose", "night"
    );

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String themeId = call.getString("themeId", "amber");

        if (!THEME_IDS.contains(themeId)) {
            call.reject("Ismeretlen ikon-téma azonosító: " + themeId);
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            String packageName = getContext().getPackageName();

            for (String id : THEME_IDS) {
                ComponentName alias = new ComponentName(packageName, packageName + ".Icon" + capitalize(id));
                int newState = id.equals(themeId)
                        ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                        : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
                pm.setComponentEnabledSetting(alias, newState, PackageManager.DONT_KILL_APP);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("themeId", themeId);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Nem sikerült megváltoztatni az alkalmazás ikonját: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getCurrentIcon(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            String packageName = getContext().getPackageName();

            String active = "amber";
            for (String id : THEME_IDS) {
                ComponentName alias = new ComponentName(packageName, packageName + ".Icon" + capitalize(id));
                int state = pm.getComponentEnabledSetting(alias);
                boolean enabled = state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                        || (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && id.equals("amber"));
                if (enabled) {
                    active = id;
                    break;
                }
            }

            JSObject ret = new JSObject();
            ret.put("themeId", active);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Nem sikerült lekérdezni az aktuális ikont: " + e.getMessage(), e);
        }
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
