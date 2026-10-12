package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.bean.InnerJobBean;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class InnerJobsCheckListTag extends CheckListTag {
	
	protected String agaf; 
	Vector allowedUnits = null;
		
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allInnerJobs = tablesContainer.getTable(TablesConstants.INNER_JOB_TABLE);
	    
	    UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
		allowedUnits = userProfile.getAllowedUnits();
		
		Vector<InnerJobBean> innerJobs=new Vector<InnerJobBean>();
		if(allInnerJobs!=null){
			InnerJobBean job=null;
			for(int i=0;i<allInnerJobs.size();i++){
				job=(InnerJobBean)allInnerJobs.get(i);
				if(job.getActive()==1){
					if(isAllowed(job) ){
						innerJobs.add(job);
					}
				}
			}
		}
		return innerJobs;
	}
	
	private boolean isAllowed(InnerJobBean job){
		if(agaf!=null && agaf.length()>0){
			return agaf.equals(job.getOrgUnit());
		}else if(allowedUnits!=null && allowedUnits.contains(job.getOrgUnit())){
			return true;
		}
		
		return false;
	}

	public String getAgaf() {
		return agaf;
	}

	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}
	
	
	
}
