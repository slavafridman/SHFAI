package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.forms.ActivityForm;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class LocalMokedsCheckListTag extends CheckListTag {
	
	protected String moked;
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allActivities = tablesContainer.getTable(TablesConstants.ACTIVITY_TABLE);
	        
		Vector<ActivityForm> activities=new Vector<ActivityForm>();
		if(allActivities!=null){
			ActivityForm activity=null;
			String mokedStr=null;
			int size=allActivities.size();
			for(int i=0;i<size;i++){
				activity=(ActivityForm)allActivities.get(i);
				mokedStr=activity.getMoked();
				if(mokedStr!=null && mokedStr.equals(moked)){
					if (activity.getVirtualActivity()==null){
						activities.add(activity);
					}
				}
			}
		}	
		return activities;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}
}
