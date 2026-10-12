package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.bean.ExceptionActivityBean;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class ExceptionCheckListTag extends CheckListTag {
	
	protected String moked;
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allExceptions = tablesContainer.getTable(TablesConstants.EXCEPTION_TABLE);
	    
	    
		Vector<ExceptionActivityBean> exceptions=new Vector<ExceptionActivityBean>();
		if(allExceptions!=null){
			ExceptionActivityBean exception=null;
			for(int i=0;i<allExceptions.size();i++){
				exception=(ExceptionActivityBean)allExceptions.get(i);
				if(exception.getSiteId()!=null && exception.getSiteId().equals(SHFTableUtils.getSiteCodeOfUnit(moked))){
					exceptions.add(exception);
				}
			}
		}
		
		return exceptions;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}
	
	
	
}
