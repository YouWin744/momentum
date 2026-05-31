package com.momentum.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onPause() {
        PendingTasksWidgetProvider.updateAllWidgets(this);
        super.onPause();
    }
}
