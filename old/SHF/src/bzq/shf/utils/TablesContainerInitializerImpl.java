package bzq.shf.utils; 


import bzq.db.DBException;
import bzq.general.BaseException;
import bzq.shf.model.LoadTables;
import bzq.utils.TablesContainer;
import bzq.utils.TablesContainerInitializer;
 
/**
 * Insert the type's description here.
 * Creation date: (13/03/2003 10:02:17)
 * @author: Miri Schwartz
 */
public class TablesContainerInitializerImpl implements TablesContainerInitializer {
	
/**
 * Insert the method's description here.
 * Creation date: (13/03/2003 10:02:17)
 * @return bzq.utils.TablesContainer
 */
public TablesContainer getTablesContainer() throws BaseException {

    TablesContainer tablesContainer = new TablesContainer();
    LoadTables loadTables = new LoadTables(tablesContainer);

    try {
		loadTables.load(TablesConstants.JOB_TABLE);
		loadTables.load(TablesConstants.UNIT_TABLE);
		loadTables.load(TablesConstants.SITE_UNIT_TABLE);
		loadTables.load(TablesConstants.ACTIVITY_TABLE);
		loadTables.load(TablesConstants.EVENT_REASON_TABLE);
		loadTables.load(TablesConstants.SKILL_TABLE);
		loadTables.load(TablesConstants.SYSTEM_PARAM);
		loadTables.load(TablesConstants.EXCEPTION_TABLE);
		loadTables.load(TablesConstants.VIRTUAL_ACTIVITY);
		loadTables.load(TablesConstants.COMPLETION_TABLE);
		loadTables.load(TablesConstants.INNER_JOB_TABLE);
		loadTables.load(TablesConstants.TIMEOFF_TABLE);
		loadTables.load(TablesConstants.CATEGORY_JOB);
		loadTables.load(TablesConstants.MOBILE_AUDIT_REF);
		
    } catch (DBException e) {
        e.printStackTrace();
    }

    return tablesContainer;
}

/**
 * Insert the method's description here.
 * Creation date: (02/04/2003 08:43:32)
 */
public void reloadTable(String tableName) throws DBException  {
	
	LoadTables loadTables = new LoadTables(bzq.utils.AppResources.getInstance().getTablesContainer());
	loadTables.load(tableName);
}
}
