/*
 * Created on 23/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import java.util.ArrayList;
import java.util.StringTokenizer;
import java.util.Vector;
import bzq.forms.TableInfo;
import bzq.shf.bean.ActivityBean;
import bzq.shf.bean.ExceptionActivityBean;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.forms.ActivityForm;
import bzq.shf.forms.BuildingForm;
import bzq.shf.forms.EventReasonForm;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.forms.TableForm;
import bzq.shf.model.BuildingModel;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFTableUtils {
	
	
	public static Vector getEventReasonsOfType(int type){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector reasons=tc.getTable("eventReasonCode");
		Vector result=new Vector();
		if(reasons!=null)
		for(int i=0;i<reasons.size();i++){
			EventReasonForm reason=(EventReasonForm)reasons.get(i);
			if(reason.getType()==type){
				result.add(reason);
			}
		}
		return result;
	}
	
	public static OrgUnitTableForm getUnitByCode(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector units=tc.getTable("unitCode");
		if(units!=null)
		for(int i=0;i<units.size();i++){
			OrgUnitTableForm org=(OrgUnitTableForm)units.get(i);
			if(org.getCode().equals(code)){
				return org;
			}
		}
		return null;
	}
	
	public static OrgUnitTableForm[] getAllUnitsOfType(String type){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector units=tc.getTable("unitCode");
		Vector v=new Vector();
		if(units!=null)
		for(int i=0;i<units.size();i++){
			OrgUnitTableForm org=(OrgUnitTableForm)units.get(i);
			if(org.getType().equals(type)){
				v.add(org);	
			}
		}
		return (OrgUnitTableForm[])v.toArray();
	}
	
	public static String getUnitName(String code){
		OrgUnitTableForm org=getUnitByCode(code);
		return (org==null)?"":org.getDescription();
	}
	
	public static String getMokedCodeOf(String code){
		try{
			OrgUnitTableForm org=getUnitByCode(code);
			String orgType=org.getType();
			if(org == null) return null;
			if(orgType.equals(SHFConstants.MOKED_UNIT)) return code;
			if(orgType.equals(SHFConstants.TEAM_UNIT)) return org.getParent();
			return null;
		}catch (Exception e) {
			return null;
		}		
	}
	
	public static String getAgafCodeOf(String code){
		OrgUnitTableForm org=getUnitByCode(code);
		if(org!=null){
			String orgType=org.getType();
			if(org==null) return null;
			if(orgType.equals(SHFConstants.AGAF_UNIT)) 
				return code;
			if(orgType.equals(SHFConstants.MOKED_UNIT))
				return org.getParent();
			if(org.getType().equals(SHFConstants.TEAM_UNIT))
				return getUnitByCode(org.getParent()).getParent();
		}
		return null;
	}
	
	public static String getDivCodeOf(String code){
		OrgUnitTableForm org=getUnitByCode(code);
		if(org!=null){
			String orgType=org.getType();
			if(org==null) return null;
			if(orgType.equals(SHFConstants.HATIVA_UNIT)) 
				return code;
			if(orgType.equals(SHFConstants.AGAF_UNIT)) 
				return org.getParent();
			if(orgType.equals(SHFConstants.MOKED_UNIT))
				return getUnitByCode(org.getParent()).getParent();
			if(org.getType().equals(SHFConstants.TEAM_UNIT)){
				org=getUnitByCode(org.getParent());
				return getUnitByCode(org.getParent()).getParent();
			}
		}
		return null;
	}
	
	public static String getBusinessDivCodeOf(String code){
		OrgUnitTableForm org=getUnitByCode(code);
		String orgType=org.getType();
		if(org==null) return null;
		while (!org.getParent().equals("00000000")) 
		{
			orgType=org.getType();
			if(orgType.equals(SHFConstants.HATIVA_UNIT))
			{
				return org.getCode();
			} else {
				org=getUnitByCode(org.getParent());
			}
		}
		return null;		
	}
	
	public static String getParentUnitNameOf(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("unitCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			OrgUnitTableForm org=(OrgUnitTableForm)v.get(i);
			if(org.getCode().equals(code)){
				return org.getParent();
			}
		}
		return "";
	}
	
	
	
	public static String getUnitCodeOfSite(String site){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("siteUnitTable");
		if(v!=null){
			for(int i=0;i<v.size();i++){
				TableForm siteUnit=(TableForm)v.get(i);
				if(siteUnit.getCode().equals(site)){
					return siteUnit.getDescription();	
				}
			}
		}
		return null;
	}
	
	public static String getSiteCodeOfUnit(String unit){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("siteUnitTable");
		if(v!=null){
			for(int i=0;i<v.size();i++){
				TableForm siteUnit=(TableForm)v.get(i);
				if(siteUnit.getDescription().equals(unit)){
					return siteUnit.getCode();	
				}
			}
		}
		return null;
	}
	
	public static String getTimeoffName(String code){
		if(code==null)
			return "חופשה";
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("timeoffCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			TableForm ex=(TableForm)v.get(i);
			if(ex.getCode().equals(code))
				return ex.getDescription();
		}
		return "";
	}
	
	public static String getExceptionName(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("exceptionCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			TableForm ex=(TableForm)v.get(i);
			if(ex.getCode().equals(code))
				return ex.getDescription();
		}
		return "";
	}
//Yuval 11.08.09	
	public static Vector getExceptionsForSite(String site){
		Vector returnV = new Vector();
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector tcVector = (Vector)tc.getTable("exceptionCode");
		TableInfo tableInfo=null;
		TableForm tableform=new TableForm();
		for (int i=0; i<tcVector.size(); i++){
			tableInfo = (TableInfo)tcVector.elementAt(i);
			String str = tableInfo.getDescription();
			ExceptionActivityBean excp =(ExceptionActivityBean)tableInfo;
			if(excp != null){
				if(excp.getSiteId() != null ){
//					System.out.println("site id: "+excp.getSiteId()+", String site: "+site);
					if (excp.getSiteId().equals(site)) {
						tableform.setCode(excp.getCode().trim());
						tableform.setDescription(excp.getDescription());
						returnV.add(excp);
					}
				}else{
//					System.out.println("excep is NULL for site");
				}	
			}
			
		}
		return returnV;
	}
//	Yuval 11.08.09	- end
	public static String getEventReasonName(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("eventReasonCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			TableForm ex=(TableForm)v.get(i);
			if(ex.getCode().equals(code))
				return ex.getDescription();
		}
		return "";
	}
	
	public static String getJobName(int code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("jobCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			TableForm job=(TableForm)v.get(i);
			if(Integer.parseInt(job.getCode())==code){
				return job.getDescription();
			}
		}
		return "";
	}
	
	public static String getInnerJobName(String code){
		TableForm innerJob=getInnerJob(code);
		if(innerJob!=null){
			return innerJob.getDescription();
		}
		return "";
	}
	
	public static InnerJobBean getInnerJob(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("innerJobCode");
		if(v!=null)
		for(int i=0;i<v.size();i++){
			InnerJobBean job=(InnerJobBean)v.get(i);
			if(job.getCode().equals(code)){
				return job;
			}
		}
		return null;
	}
	public static String getReasonDesc(int code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("eventReasonCode");
		if(v!=null && !v.isEmpty())
			for(int i=0;i<v.size();i++){
				EventReasonForm reason=(EventReasonForm)v.get(i);
				if(Integer.parseInt(reason.getCode())==code){
					return reason.getDescription();
				}
			}
		return "";
	}
	
	public static EventReasonForm getEventReason(int code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector v=tc.getTable("eventReasonCode");
		if(v!=null && !v.isEmpty())
			for(int i=0;i<v.size();i++){
				EventReasonForm reason=(EventReasonForm)v.get(i);
				if(Integer.parseInt(reason.getCode())==code){
					return reason;
				}
			}
		return null;
	}
	
	public static String getActivityName(String code){
		if(code!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			StringTokenizer st=new StringTokenizer(code,";");
			if(!st.hasMoreTokens()) return "";
			String str=st.nextToken();
			Vector v=tc.getTable("activityCode");
			if(v!=null){
				for(int i=0;i<v.size();i++){
					TableForm job=(TableForm)v.get(i);
					if(job.getCode().equals(str)){
						return job.getDescription();
					}
				}
			}
		}
		return "";
	}
	
	
	public static String getMokedNameOfSite(String site){
		String unitCode=getUnitCodeOfSite(site);
		return getUnitName(unitCode);
	}
	
	public static String getMokedNameOfActivity(String actvityTypeId){
		AppResources appRes = AppResources.getInstance();
		TablesContainer tc = appRes.getTablesContainer();
		Vector <ActivityForm> v = tc.getTable("activityCode");
		if(v != null){
			for (ActivityForm form : v){
				if(form.getCode().equals(actvityTypeId)){
					return getMokedNameOfSite(form.getSiteId());
				}
			}
		}
		return "";
	}
	
	public static Vector<ActivityForm> getActivitiesBySiteId(String siteId){
		Vector<ActivityForm> result = new Vector<ActivityForm>();
		Vector <ActivityForm> v = AppResources.getInstance().getTablesContainer().getTable("activityCode");
		if (v != null) {
			for (ActivityForm form : v){
				if (form.getSiteId().equals(siteId)) {
					result.add(form);
				}
			}
		}
		return result;
	}
	
	public static String getSiteIdByActivityId(String activityId){
		String result = "";
		Vector <ActivityForm> v = AppResources.getInstance().getTablesContainer().getTable("activityCode");
		if (v != null) {
			for (ActivityForm form : v){
				if (form.getCode().equals(activityId)) {
					return form.getSiteId();
				}
			}
		}
		return result;
	}
	
	public static ActivityForm getActivityByCode(String code){
		if(code!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			StringTokenizer st=new StringTokenizer(code,";");
			if(!st.hasMoreTokens()) return null;
			String str=st.nextToken();
			Vector v=tc.getTable("activityCode");
			if(v!=null){
				for(int i=0;i<v.size();i++){
					ActivityForm tmp=(ActivityForm)v.get(i);
					if(tmp.getCode().equals(str)){
						return tmp;
					}
				}
			}
		}
		return null;
	}
	
	
	// Svetlana
	public static String getActivityNames(String codes){
		String activityDescriptions="";
		if(codes!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			Vector v=tc.getTable("activityCode");
			if(v!=null){
				StringTokenizer st=new StringTokenizer(codes,";");
				if(!st.hasMoreTokens()) 
					return activityDescriptions;
				boolean flag=false;
				while(st.hasMoreTokens()){
					String str=st.nextToken();
					for(int i=0;i<v.size();i++){
						TableForm activity=(TableForm)v.get(i);
						if(activity.getCode().equals(str)){
							if(flag){
								activityDescriptions+= "<br>";
							}
							activityDescriptions+= activity.getDescription();
							flag=true;
							break;
						}
					}
				}
			}
		}
		return activityDescriptions;
	}
	
	// Svetlana
	public static String getActivityNamesExport(String codes){
		String activityDescriptions="";
		if(codes!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			Vector v=tc.getTable("activityCode");
			if(v!=null){
				StringTokenizer st=new StringTokenizer(codes,";");
				if(!st.hasMoreTokens()) 
					return activityDescriptions;
				boolean flag=false;
				while(st.hasMoreTokens()){
					String str=st.nextToken();
					for(int i=0;i<v.size();i++){
						TableForm activity=(TableForm)v.get(i);
						if(activity.getCode().equals(str)){
							if(flag){
								activityDescriptions+= ",";
							}
							activityDescriptions+= activity.getDescription();
							flag=true;
							break;
						}
					}
				}
			}
		}
		return activityDescriptions;
	}
	
	public static String getVirtualActivityName(String code){
		if(code!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			StringTokenizer st=new StringTokenizer(code,";");
			if(!st.hasMoreTokens()) return "";
			String str=st.nextToken();
			Vector v=tc.getTable("virtualActivityCode");
			if(v!=null){
				for(int i=0;i<v.size();i++){
					TableForm job=(TableForm)v.get(i);
					if(job.getCode().equals(str)){
						return job.getDescription();
					}
				}
			}
		}
		return "";
	}
	
	public static String getSkillName(String code){
		if(code!=null){	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			StringTokenizer st=new StringTokenizer(code,";");
			if(!st.hasMoreTokens()) return "";
			String str=st.nextToken();
			Vector v=tc.getTable("skillCode");
			if(v!=null){
				for(int i=0;i<v.size();i++){
					TableForm job=(TableForm)v.get(i);
					if(job.getCode().equals(str)){
						return job.getDescription();
					}
				}
			}
		}
		return "";
	}
	
	public static String getActivityCodeWithoutColon(String code){
		if(code==null) return "0";
		StringTokenizer st=new StringTokenizer(code,";");
		if(!st.hasMoreTokens()) return code;
		return st.nextToken();
	}
	
	public static boolean isActivitiesEquals(String str1,String str2){
		return getActivityCodeWithoutColon(str1).equals(getActivityCodeWithoutColon(str2));
	}
	
//Yuval - 27.01.09 
//Return bean of all activity without ";"	
	public static ActivityBean[] getAllActivities(){
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			
			Vector allActivity = new Vector();
			Vector v=tc.getTable("activityCode");
			if(v!=null){
				for(int i=0;i<v.size();i++){
					ActivityBean actBean = new ActivityBean();
					TableForm job=(TableForm)v.get(i);
					StringTokenizer st=new StringTokenizer(job.getCode(),";");
					actBean.setActivityCode(st.nextToken());
					actBean.setActivityDesc(job.getDescription());
					allActivity.add(actBean);
				}
				
			return (ActivityBean[])allActivity.toArray(new ActivityBean[allActivity.size()]);
			}
		return null;
	}
	
	public static String getCompletionDesc(String code){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		String desc="";
		Vector<TableForm> v=tc.getTable("completionCode");
		for (TableForm form : v){
			if(form.getCode().equals(code)){
				return form.getDescription();
			}
		}

		return desc;
	}

	/**
	 * return true if two inner jobs can switch with each other
	 * @param code1
	 * @param code2
	 * @return true if two jobs can switch with each other
	 */
	public static boolean isInnerJobsSwitchable(String code1,String code2) {
		//if same inner job return true
		if(code1.equals(code2)){
			return true;
		}
		
		//if same group return true
		InnerJobBean innerJob1=getInnerJob(code1);
		InnerJobBean innerJob2=getInnerJob(code2);
		if(innerJob1!=null && innerJob2!=null){
			if(innerJob1.getOrgUnit()!=null && innerJob2.getOrgUnit()!=null && innerJob1.getOrgUnit().equals(innerJob2.getOrgUnit())){
				if(innerJob1.getGroupId()>0 && innerJob2.getGroupId()>0 && innerJob1.getGroupId()==innerJob2.getGroupId()){
					return true;
				}
			}
		}
		
		return false;
	}

	public static ArrayList<BuildingForm> getBuildingsByMoked(String moked) {
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		try{
			BuildingModel buildingModel=new BuildingModel();
			return buildingModel.getBuildingsByMoked(moked);
		}catch (Exception e) {
			return null;
		}
	}

	
	
}
