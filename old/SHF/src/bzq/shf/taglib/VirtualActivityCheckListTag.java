package bzq.shf.taglib;

import java.util.Vector;


import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;
 
public class VirtualActivityCheckListTag extends CheckListTag{
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allActivities = tablesContainer.getTable(TablesConstants.VIRTUAL_ACTIVITY);
	        
		
		return allActivities;
	}

	
}
