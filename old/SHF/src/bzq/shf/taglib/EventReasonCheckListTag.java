package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.forms.EventReasonForm;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class EventReasonCheckListTag extends CheckListTag {
	
	protected int type;
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allEvents = tablesContainer.getTable(TablesConstants.EVENT_REASON_TABLE);
	    
	    
		Vector<EventReasonForm> reasons=new Vector<EventReasonForm>();
		if(allEvents!=null){
			EventReasonForm reason=null;
			for(int i=0;i<allEvents.size();i++){
				reason=(EventReasonForm)allEvents.get(i);
				if(reason.getType()==type){
					reasons.add(reason);
				}
			}
		}
		
		return reasons;
	}

	public int getType() {
		return type;
	}

	public void setType(int type) {
		this.type = type;
	}

	
	
	
	
}
