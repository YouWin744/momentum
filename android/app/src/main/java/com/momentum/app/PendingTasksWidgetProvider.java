package com.momentum.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONArray;

public class PendingTasksWidgetProvider extends AppWidgetProvider {
    private static final String PREFERENCES_NAME = "CapacitorStorage";
    private static final String TASKS_KEY = "momentum_widget_tasks";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildViews(context, appWidgetId));
        }
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.momentum_widget_list);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, PendingTasksWidgetProvider.class);
        int[] appWidgetIds = manager.getAppWidgetIds(componentName);
        for (int appWidgetId : appWidgetIds) {
            manager.updateAppWidget(appWidgetId, buildViews(context, appWidgetId));
        }
        manager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.momentum_widget_list);
    }

    private static RemoteViews buildViews(Context context, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget);
        views.setOnClickPendingIntent(R.id.momentum_widget_title_action, createOpenAppIntent(context));
        views.setRemoteAdapter(R.id.momentum_widget_list, createListIntent(context, appWidgetId));
        views.setEmptyView(R.id.momentum_widget_list, R.id.momentum_widget_empty);
        int taskCount = getTaskCount(context);
        views.setTextViewText(
            R.id.momentum_widget_count,
            context.getResources().getQuantityString(R.plurals.momentum_widget_task_count, taskCount, taskCount)
        );
        return views;
    }

    private static int getTaskCount(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        String tasksJson = preferences.getString(TASKS_KEY, "[]");
        try {
            return new JSONArray(tasksJson).length();
        } catch (Exception ignored) {
            return 0;
        }
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

    private static Intent createListIntent(Context context, int appWidgetId) {
        Intent intent = new Intent(context, PendingTasksWidgetService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));
        return intent;
    }
}
