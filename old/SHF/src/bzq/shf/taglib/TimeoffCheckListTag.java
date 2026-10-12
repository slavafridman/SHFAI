package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.bean.TimeoffBean;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class TimeoffCheckListTag extends CheckListTag {
	
	protected String moked;
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allList = tablesContainer.getTable(TablesConstants.TIMEOFF_TABLE);
	    
	    
		Vector<TimeoffBean> vector=new Vector<TimeoffBean>();
		if(allList!=null){
			TimeoffBean timeoffBean=null;
			for(int i=0;i<allList.size();i++){
				timeoffBean=(TimeoffBean)allList.get(i);
				if(String.valueOf(timeoffBean.getSite()).equals(SHFTableUtils.getSiteCodeOfUnit(moked))){
					vector.add(timeoffBean);
				}
			}
		}
		
		return vector;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}
	
	
	
}
