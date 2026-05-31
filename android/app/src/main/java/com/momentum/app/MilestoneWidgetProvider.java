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

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

public class MilestoneWidgetProvider extends AppWidgetProvider {
    private static final String PREFERENCES_NAME = "CapacitorStorage";
    private static final String MILESTONES_KEY = "momentum_widget_milestones";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildViews(context));
        }
        PendingTasksWidgetRefreshReceiver.scheduleNextRefresh(context);
    }

    @Override
    public void onEnabled(Context context) {
        PendingTasksWidgetRefreshReceiver.scheduleNextRefresh(context);
    }

    @Override
    public void onDisabled(Context context) {
        PendingTasksWidgetRefreshReceiver.scheduleNextRefresh(context);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, MilestoneWidgetProvider.class);
        int[] appWidgetIds = manager.getAppWidgetIds(componentName);
        for (int appWidgetId : appWidgetIds) {
            manager.updateAppWidget(appWidgetId, buildViews(context));
        }
        PendingTasksWidgetRefreshReceiver.scheduleNextRefresh(context);
    }

    public static boolean hasWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, MilestoneWidgetProvider.class);
        return manager.getAppWidgetIds(componentName).length > 0;
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.milestone_widget);
        views.setOnClickPendingIntent(R.id.milestone_widget_root, createOpenAppIntent(context));

        MilestoneOccurrence occurrence = getNextMilestone(context);
        if (occurrence == null) {
            views.setViewVisibility(R.id.milestone_widget_content, View.GONE);
            views.setViewVisibility(R.id.milestone_widget_empty, View.VISIBLE);
            return views;
        }

        views.setViewVisibility(R.id.milestone_widget_content, View.VISIBLE);
        views.setViewVisibility(R.id.milestone_widget_empty, View.GONE);
        views.setTextViewText(R.id.milestone_widget_title, formatTitle(occurrence));
        views.setTextViewText(R.id.milestone_widget_date, formatDate(occurrence.nextDate));
        views.setTextViewText(R.id.milestone_widget_countdown, formatCountdown(occurrence.nextDate));
        return views;
    }

    private static MilestoneOccurrence getNextMilestone(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        String milestonesJson = preferences.getString(MILESTONES_KEY, "[]");
        Calendar today = getToday();
        MilestoneOccurrence nearest = null;

        try {
            JSONArray milestones = new JSONArray(milestonesJson);
            for (int index = 0; index < milestones.length(); index++) {
                JSONObject milestone = milestones.getJSONObject(index);
                Calendar originalDate = parseDate(milestone.getString("date"));
                Calendar nextDate = getNextOccurrence(originalDate, today);
                MilestoneOccurrence occurrence = new MilestoneOccurrence(
                    milestone.optString("name", ""),
                    nextDate,
                    nextDate.get(Calendar.YEAR) - originalDate.get(Calendar.YEAR)
                );
                if (nearest == null || occurrence.nextDate.before(nearest.nextDate)) {
                    nearest = occurrence;
                }
            }
        } catch (Exception ignored) {
            return null;
        }

        return nearest;
    }

    private static Calendar getNextOccurrence(Calendar originalDate, Calendar today) {
        int year = Math.max(originalDate.get(Calendar.YEAR), today.get(Calendar.YEAR));
        while (true) {
            Calendar candidate = createDate(
                year,
                originalDate.get(Calendar.MONTH) + 1,
                originalDate.get(Calendar.DAY_OF_MONTH)
            );
            if (candidate != null && !candidate.before(today)) {
                return candidate;
            }
            year++;
        }
    }

    private static String formatTitle(MilestoneOccurrence occurrence) {
        if (occurrence.anniversary <= 0) {
            return occurrence.name;
        }
        return occurrence.name + " · " + formatOrdinal(occurrence.anniversary);
    }

    private static String formatDate(Calendar date) {
        return date.get(Calendar.YEAR) + "-"
            + String.format(Locale.US, "%02d", date.get(Calendar.MONTH) + 1) + "-"
            + String.format(Locale.US, "%02d", date.get(Calendar.DAY_OF_MONTH));
    }

    private static String formatCountdown(Calendar date) {
        long days = TimeUnit.MILLISECONDS.toDays(date.getTimeInMillis() - getToday().getTimeInMillis());
        if (days == 0) {
            return "Today";
        }
        if (days == 1) {
            return "Tomorrow";
        }
        return "In " + days + " days";
    }

    private static String formatOrdinal(int number) {
        int lastTwoDigits = number % 100;
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return number + "th";
        }
        switch (number % 10) {
            case 1:
                return number + "st";
            case 2:
                return number + "nd";
            case 3:
                return number + "rd";
            default:
                return number + "th";
        }
    }

    private static Calendar parseDate(String date) {
        String[] parts = date.split("-");
        Calendar parsedDate = createDate(
            Integer.parseInt(parts[0]),
            Integer.parseInt(parts[1]),
            Integer.parseInt(parts[2])
        );
        if (parsedDate == null) {
            throw new IllegalArgumentException("Invalid milestone date");
        }
        return parsedDate;
    }

    private static Calendar getToday() {
        Calendar localToday = Calendar.getInstance();
        Calendar today = createDate(
            localToday.get(Calendar.YEAR),
            localToday.get(Calendar.MONTH) + 1,
            localToday.get(Calendar.DAY_OF_MONTH)
        );
        if (today == null) {
            throw new IllegalStateException("Unable to create current date");
        }
        return today;
    }

    private static Calendar createDate(int year, int month, int day) {
        Calendar date = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        date.setLenient(false);
        date.clear();
        date.set(year, month - 1, day);
        try {
            date.getTime();
            return date;
        } catch (IllegalArgumentException ignored) {
            // Continue until the next valid occurrence, such as the next leap day.
            return null;
        }
    }

    private static PendingIntent createOpenAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        return PendingIntent.getActivity(
            context,
            1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static class MilestoneOccurrence {
        final String name;
        final Calendar nextDate;
        final int anniversary;

        MilestoneOccurrence(String name, Calendar nextDate, int anniversary) {
            this.name = name;
            this.nextDate = nextDate;
            this.anniversary = anniversary;
        }
    }
}
