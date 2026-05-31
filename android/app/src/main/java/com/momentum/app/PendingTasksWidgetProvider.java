package com.momentum.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public class PendingTasksWidgetProvider extends AppWidgetProvider {
    private static final String PREFERENCES_NAME = "CapacitorStorage";
    private static final String TASKS_KEY = "momentum_widget_tasks";
    private static final int MAX_VISIBLE_TASKS = 8;
    private static final int[] ROW_IDS = {
        R.id.momentum_widget_row_1,
        R.id.momentum_widget_row_2,
        R.id.momentum_widget_row_3,
        R.id.momentum_widget_row_4,
        R.id.momentum_widget_row_5,
        R.id.momentum_widget_row_6,
        R.id.momentum_widget_row_7,
        R.id.momentum_widget_row_8
    };
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildViews(context));
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, PendingTasksWidgetProvider.class);
        int[] appWidgetIds = manager.getAppWidgetIds(componentName);
        for (int appWidgetId : appWidgetIds) {
            manager.updateAppWidget(appWidgetId, buildViews(context));
        }
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget);
        views.setOnClickPendingIntent(R.id.momentum_widget_root, createOpenAppIntent(context));

        for (int index = 0; index < MAX_VISIBLE_TASKS; index++) {
            views.setViewVisibility(ROW_IDS[index], View.GONE);
        }

        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        String tasksJson = preferences.getString(TASKS_KEY, "[]");
        int visibleTasks = 0;

        try {
            JSONArray tasks = new JSONArray(tasksJson);
            visibleTasks = Math.min(tasks.length(), MAX_VISIBLE_TASKS);
            for (int index = 0; index < visibleTasks; index++) {
                JSONObject task = tasks.getJSONObject(index);
                views.setViewVisibility(ROW_IDS[index], View.VISIBLE);
                String name = task.optString("name", context.getString(R.string.momentum_widget_untitled_task));
                views.setTextViewText(ROW_IDS[index], name + "  |  " + formatMetadata(task));
            }
        } catch (Exception ignored) {
            visibleTasks = 0;
        }

        views.setViewVisibility(R.id.momentum_widget_empty, visibleTasks == 0 ? View.VISIBLE : View.GONE);
        views.setTextViewText(
            R.id.momentum_widget_count,
            context.getResources().getQuantityString(R.plurals.momentum_widget_task_count, visibleTasks, visibleTasks)
        );
        return views;
    }

    private static PendingIntent createOpenAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static String formatMetadata(JSONObject task) {
        String type = "long-term".equals(task.optString("type")) ? "LONG" : "SHORT";
        String targetTime = task.optString("targetTime");
        try {
            Date date = parseIsoDate(targetTime);
            String formattedTime = new SimpleDateFormat("MMM d, HH:mm", Locale.getDefault()).format(date);
            return type + "  |  " + formattedTime;
        } catch (Exception ignored) {
            return type;
        }
    }

    private static Date parseIsoDate(String value) throws ParseException {
        String pattern = value.contains(".") ? "yyyy-MM-dd'T'HH:mm:ss.SSSX" : "yyyy-MM-dd'T'HH:mm:ssX";
        return new SimpleDateFormat(pattern, Locale.US).parse(value);
    }
}
