/*
 * Created on 19/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Hashtable;
import java.util.Set;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.ActivityAimBean;
import bzq.shf.bean.ActualJobBean;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.forms.ActivityAimForm;
import bzq.shf.forms.ActualJobForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.InnerJobForm;
import bzq.shf.forms.SystemAdminForm;
import bzq.shf.model.EmployeeDataModel;
import bzq.shf.model.SystemAdminModel;
import bzq.shf.transfer.SkillForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SharingUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SystemAdminAction extends BaseAction{

	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		SystemAdminForm adminForm=null;
		SkillForm skillForm=null;
		ActivityAimForm activityAimForm=null;
		ActualJobForm actualJobForm=null;
		String[][] tmpMatrix=new String[7][24];
		
		response.setHeader("Cache-Control","no-cache");
		response.setHeader("Pragma","no-cache"); 
		response.setContentType("text/html;charset=WINDOWS-1255"); 
		
		if(param.equals("view_moked")){
			adminForm=(SystemAdminForm)form;
			SystemAdminModel admin=new SystemAdminModel(adminForm);
			admin.viewSystemParameters();
			result=mapping.findForward("success");
			request.setAttribute("adminForm",adminForm);
		}
		
		else if(param.equals("view_employee")){
			EmployeeDataForm employeeForm=(EmployeeDataForm)form;
			if(employeeForm.getEmployeeId()>0){
				EmployeeDataModel employee=new EmployeeDataModel(employeeForm);
				try {
					employee.populate();
				} catch (ShfException e) {
					employeeForm.setEmployeeId(0);
					saveErrors(request,e.getErrors());
				}
			}
			result=mapping.findForward("success");
			request.setAttribute("employeeForm",employeeForm);
		}
		
		else if(param.equals("update_employee")){
			EmployeeDataForm employeeForm=(EmployeeDataForm)form;
			if(employeeForm.getEmployeeId()>0){
				if(employeeForm.getTrained()==2){
					employeeForm.setTrained(0);
				}else{
					employeeForm.setTrained(1);
				}
				EmployeeDataModel employee=new EmployeeDataModel(employeeForm);
				try {
					employee.updateEmployeeParameters();
					employee.populate();
					logger.info("Employee with ID " +employeeForm.getIdNumber()+ " was updated" );
				} catch (ShfException e) {
					employeeForm.setEmployeeId(0);
					saveErrors(request,e.getErrors());
				}
			}
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.updateSecceeded", null));
			saveErrors(request,actionErrors);
			result=mapping.findForward("success");
			request.setAttribute("employeeForm",employeeForm);
		}
		
		else if(param.equals("save")){
			adminForm=(SystemAdminForm)form;
			SystemAdminModel admin=new SystemAdminModel(adminForm);
			try {
				admin.saveParameters();
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());
			}
			
			result=mapping.findForward("success");
			request.setAttribute("adminForm",adminForm);
		}
		
		else if(param.equals("updateSkillSave")){
			skillForm=(SkillForm)form;
			SystemAdminModel admin=new SystemAdminModel(skillForm);
			try {
				admin.updateSkill();
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());
			}
			//result=mapping.findForward("success");
			//request.setAttribute("skillForm",skillForm);
			response.sendRedirect("/shf/admin.do?action=updateSkills");
		}
		
		else if(param.equals("updateSkillParam")){
			skillForm=(SkillForm)form;
			SystemAdminModel admin=new SystemAdminModel(skillForm);
			try {
				admin.populateSkill();
			} catch (ShfException e) {
				e.printStackTrace();
			}
			result=mapping.findForward("success");
			request.setAttribute("skillForm",skillForm);
		}
		//tamar-11.11.10
		else if(param.equals("findActivityAim")){
			SystemAdminModel admin=new SystemAdminModel(activityAimForm);
			
			try {
				Vector<ActivityAimBean> vec = admin.activityList();
				request.setAttribute("activityList",vec);
				result=mapping.findForward("success");	
			} catch (ShfException e) {
				e.printStackTrace();
			}
			result=mapping.findForward("success");
			
		}
		
		else if(param.equals("showActivityAim")){
			activityAimForm=(ActivityAimForm)form;
			SystemAdminModel admin=new SystemAdminModel(activityAimForm);
			if (!activityAimForm.getMode().equals("insert")){
				try {
					admin.populateActivity();
				} catch (ShfException e) {
					e.printStackTrace();
				}
			}else{
				Vector<String[][]> activityList=new Vector<String[][]>();
				String[] activityAimArrayDay=new String[7];
				activityAimArrayDay=activityAimForm.getActivityAim().split(",");
				for(int i=0;i<7;i++){
					String[] activityAimArray=new String[24];
					activityAimArray=activityAimArrayDay[i].split(";");
					for(int j=0;j<24;j++){
					  tmpMatrix[i][j]=activityAimArray[j];
					}   
				}
				activityAimForm.setActivityAimArray(tmpMatrix);
				activityList.addElement(activityAimForm.getActivityAimArray());
				
			}
			
			result=mapping.findForward("success");
			request.setAttribute("activityAimForm",activityAimForm);
			
		}
		else if(param.equals("insertActivityAim")){
			activityAimForm=(ActivityAimForm)form;
			activityAimForm.setMode("insert");
			Vector<String[][]> activityList=new Vector<String[][]>();
			String[] activityAimArrayDay=new String[7];
			activityAimArrayDay=activityAimForm.getActivityAim().split(",");
			for(int i=0;i<7;i++){
				String[] activityAimArray=new String[24];
				activityAimArray=activityAimArrayDay[i].split(";");
				for(int j=0;j<24;j++){
					  tmpMatrix[i][j]=activityAimArray[j];
				}   
			}
			activityAimForm.setActivityAimArray(tmpMatrix);
			activityList.addElement(activityAimForm.getActivityAimArray());
			result=mapping.findForward("success");
			request.setAttribute("activityAimForm",activityAimForm);
			
		}
		else if(param.equals("deleteActivityAim")){
			activityAimForm=(ActivityAimForm)form;
			SystemAdminModel admin=new SystemAdminModel(activityAimForm);
			
			try {
				admin.deleteActivityAim();
			} catch (ShfException e) {
				e.printStackTrace();
			}
			result=mapping.findForward("success");
			request.setAttribute("activityAimForm",activityAimForm);
			
		}
		else if(param.equals("saveActivityAim")){
			activityAimForm=(ActivityAimForm)form; // extract the form coming from request
			SystemAdminModel admin=new SystemAdminModel(activityAimForm);
			String[] activityAimArrayDay=new String[7];
			activityAimArrayDay=activityAimForm.getActivityAim().split(","); // get all the data from user in a string and split by ","
			// "ActivityAim" is parameter which holds all the weekly aim via the updateActivity() method 
			for(int i=0;i<7;i++){
				activityAimForm.setActivityDay(i+1);	
				try {
					if ( "insert".equals(activityAimForm.getMode()) ){
						admin.insertActivityAim(activityAimArrayDay[i]);
					}else{
						admin.saveActivityAim(activityAimArrayDay[i]);
					}
				} catch (ShfException e) {
					saveErrors(request,e.getErrors());
					return result = mapping.findForward("insertCallAimFailed");
				}
			}
			if (activityAimForm.getMode().equals("insert")){
				activityAimForm.setMode("");
				saveErrors(request,(new ShfException(new ActionError("shf.success.insertSecceeded"))).getErrors() );
			    return result = mapping.findForward("successInsert");
			}else{    
			    request.setAttribute("activityAimForm",activityAimForm);
			    saveErrors(request,(new ShfException(new ActionError("shf.success.updateSecceeded"))).getErrors() );
			    return result = mapping.findForward("success");
			}    
			
		}
		//tamar-11.
		//tamar-11.11.10
		
		else if(param.equals("manage_innerJobs")){
			InnerJobForm innerJobForm=(InnerJobForm)form;
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc = appRes.getTablesContainer();
			Vector jobstable = tc.getTable("innerJobCode");
			
			if("view".equals(innerJobForm.getAction())){
				Vector<InnerJobBean> jobs=new Vector<InnerJobBean>();
				InnerJobBean jobBean=null;
				for(int i=0;i<jobstable.size();i++){
					jobBean=(InnerJobBean)jobstable.get(i);
					if(innerJobForm.getAllowedUnits().contains(jobBean.getOrgUnit())){
						jobs.add(jobBean);
					}
				}
				request.setAttribute("jobs",jobs);
				result=mapping.findForward("successView");
			}
			else if("add".equals(innerJobForm.getAction())){
				SystemAdminModel systemAdminModel=new SystemAdminModel(innerJobForm);
				try{
					systemAdminModel.addInnerJob();
					SharingUtils.reloadTables(TablesConstants.INNER_JOB_TABLE);
					
				}catch (Exception e) {
					
				}
				result=mapping.findForward("successAdd");
			}
			else if("viewUpdate".equals(innerJobForm.getAction())){
				InnerJobBean job=SHFTableUtils.getInnerJob(innerJobForm.getCode());
				InnerJobForm selected=new InnerJobForm();
				if(job!=null){
					selected.setCode(job.getCode());
					selected.setDescription(job.getDescription());
					selected.setOrgUnit(job.getOrgUnit());
					selected.setActive(job.getActive());
					selected.setGroupId(job.getGroupId());
					request.setAttribute("innerJobForm", selected);
				}
				result=mapping.findForward("successViewUpdate");
			}
			else if("update".equals(innerJobForm.getAction())){
				SystemAdminModel systemAdminModel=new SystemAdminModel(innerJobForm);
				try{
					systemAdminModel.updateInnerJob();
					SharingUtils.reloadTables(TablesConstants.INNER_JOB_TABLE);
				}catch (Exception e) {
					
				}
				result=mapping.findForward("successAdd");
			}
			else if("delete".equals(innerJobForm.getAction())){
				SystemAdminModel systemAdminModel=new SystemAdminModel(innerJobForm);
				try{
					systemAdminModel.deleteInnerJob();
					SharingUtils.reloadTables(TablesConstants.INNER_JOB_TABLE);
				}catch (ShfException e) {
					logger.error(e.getMessage());
					saveErrors(request,e.getErrors());
				}
				
				request.setAttribute("innerJobForm", innerJobForm);
				result=mapping.findForward("successAdd");
			}
			else if("groups".equals(innerJobForm.getAction())){
				SystemAdminModel systemAdminModel=new SystemAdminModel(innerJobForm);
				Hashtable<Integer, Set<InnerJobBean>> groupsMap=systemAdminModel.getInnerJobsGroups();
				request.setAttribute("map", groupsMap);
				request.setAttribute("innerJobForm", innerJobForm);
				result=mapping.findForward("successGroups");
			}
		}
		//15.02.2011-actual_job
		else if(param.equals("showActualJob")){
			actualJobForm=(ActualJobForm)form;
			SystemAdminModel admin=new SystemAdminModel(actualJobForm);
			try{
			Vector<ActualJobBean> vec=admin.populateCategoryJob();
			request.setAttribute("actualJobList",vec);
			
			}catch (ShfException e) {
				logger.error(e.getMessage());
				saveErrors(request,e.getErrors());
			}	
			result=mapping.findForward("success");
			request.setAttribute("ActualJobForm",actualJobForm);
			}
		
		else if(param.equals("updateActualJob")){
			
			PrintWriter out =response.getWriter();
			actualJobForm=(ActualJobForm)form;
			//String[] jobSelect=(String[]) request.getParameterValues("jobSelect");
			SystemAdminModel admin=new SystemAdminModel(actualJobForm);
			try{
				admin.updateCategoryJob(actualJobForm);
				out.print("Update sucess");
			} catch (ShfException e) {
				e.printStackTrace();
			}
			out.print("Update Error");
			result=mapping.findForward("successUpdate");
			}
				
		//15.02.2011-actual_job
		
		
		return result;
	}
}
