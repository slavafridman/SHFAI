/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashSet;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.EmployeeCompletionBean;
import bzq.shf.forms.CTICompletionForm;
import bzq.shf.forms.CTISearchCompletionForm;
import bzq.shf.forms.TableForm;
import bzq.shf.model.CTICompletion;
import bzq.shf.model.EmployeeDataModel;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CTIAction extends BaseAction {

	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	Logger logger=Logger.getLogger(CTIAction.class);
	public ActionForward performAction(
		ActionMapping mapping,
		ActionForm form,
		HttpServletRequest request,
		HttpServletResponse response)
		throws IOException, ServletException {
		
		ActionForward result=null;
		String param=(String)parameters.get("param");
		
		
		
		try{
			if("menu".equals(param)){
				result=mapping.findForward("success");
			}
			else if("param".equals(param)){
				CTICompletionForm completionForm=(CTICompletionForm)form;
				CTICompletion completion=new CTICompletion(completionForm);
				
				// Igal, demand for single site for selected profiles, 8.2015 START
				UserProfile userProfile = (UserProfile) request.getSession(false).getAttribute("userProfile"); 
				if (userProfile != null) {
					if (userProfile.getAllowedActivities().contains("completion_single_site") && userProfile.getAllowedMoked() == null) {
						try {
							completionForm.setCtiAllowedMoked(completion.getAllowedMoked(userProfile.getId()));
						} catch (Exception e) {
							logger.error("'completion_single_site' security activity detected but an error occured while attemting to acquire allowedMoked (and thus now using allowed_units instead) : "+e.getMessage());
						}
					}
				}// Igal, demand for single site for selected profiles in completion screen, 8.2015 END
				
				if(!("back".equals(completionForm.getActionCode())))
					completion.setAddDefaults();
				request.setAttribute("completionForm",completionForm);
				result=mapping.findForward("success"); 
			}
			else if("result".equals(param)){
				logger.info("param=result");
				CTICompletionForm completionForm=(CTICompletionForm)form;
				CTICompletion completion=new CTICompletion(completionForm);
				Vector vec=null;
				
				// Igal, demand for single site for selected profiles, 8.2015
				String ctiSingleMokedUnitId = null;
				UserProfile userProfile = (UserProfile) request.getSession(false).getAttribute("userProfile");
				if (userProfile != null) {
					if (userProfile.getAllowedActivities().contains("completion_single_site") && completionForm.getCtiAllowedMoked() != null) {
						ctiSingleMokedUnitId = completionForm.getCtiAllowedMoked();
					}
				}
				try{
					vec=completion.populateCompletionResult(null, ctiSingleMokedUnitId);
				}catch (ShfException e) {
					request.setAttribute("completionForm",completionForm);
					throw e;
				}
				request.setAttribute("employees",vec);
				request.setAttribute("completionForm",completionForm);
				request.getSession(false).setAttribute("completionForm", completionForm); // required in "setCompletion" param
				result=mapping.findForward("success"); 
			}
			else if("setCompletion".equals(param)){
				//TODO check demand for single site for selected profiles, 8.2015 for this action param
				CTICompletionForm completionForm = (CTICompletionForm)form;
				CTICompletionForm prevCompletionForm = (CTICompletionForm)request.getSession(false).getAttribute("completionForm");
				if(prevCompletionForm != null){
					// getTeam() in completionForm is incorrect thus overwritten by same value from prevCompletionForm Igal 7.2013
					completionForm.setTeam(prevCompletionForm.getTeam());
					request.getSession(false).removeAttribute("completionForm");
				}
			
				Vector shifts = null, employees = null;
				
				if(completionForm.isShiftData()){
					CTICompletion completion=new CTICompletion(completionForm);
					
					// Igal, demand for single site for selected profiles, 8.2015
					String ctiSingleMokedUnitId = null;
					UserProfile userProfile = (UserProfile) request.getSession(false).getAttribute("userProfile");
					if (userProfile != null) {
						if (userProfile.getAllowedActivities().contains("completion_single_site") && completionForm.getCtiAllowedMoked() != null) {
							ctiSingleMokedUnitId = completionForm.getCtiAllowedMoked();
						}
					}
					shifts=completion.populateCompletionResult(completionForm.getSelectedEmployees(), ctiSingleMokedUnitId);
					request.setAttribute("allChecked", shifts);
				}else{
					employees=EmployeeDataModel.populateEmployees(completionForm.getSelectedEmployees());
					request.setAttribute("allChecked", employees);
				}
				
				result=mapping.findForward("success"); 
				request.setAttribute("completionForm",completionForm);
			}
			else if("saveCompletion".equals(param)){
				CTICompletionForm completionForm=(CTICompletionForm)form;
				CTICompletion completion=new CTICompletion(completionForm);
				Vector errors=null;
				HashSet<String> set=null;
				try{
					set=new HashSet<String>();
					errors=completion.saveCompletions(set);
					errors=EmployeeDataModel.populateEmployees((Integer[])errors.toArray(new Integer[errors.size()]));
				}catch (ShfException e) {
					throw e;
				}finally{
					request.setAttribute("completionForm",completionForm);
				}
				request.setAttribute("errorSet",set);
				request.setAttribute("errors",errors);
				result=mapping.findForward("success");
			}
			
			///////////// View and update /////////////
			
			else if("view_param".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				if(!("back".equals(searchCompletionForm.getActionCode())))
					completion.setViewDefaults();
				completion.populateAddedByList();
				request.setAttribute("completionForm",searchCompletionForm);
				result=mapping.findForward("success");
			}
			else if("view_result".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				Vector<EmployeeCompletionBean> completions = completion.populate();
				completion.populateAddedByList();
				request.setAttribute("completionForm",searchCompletionForm);
				request.setAttribute("completions",completions);
				if("export".equals(searchCompletionForm.getActionCode())){
					result=mapping.findForward("successExcell");
					searchCompletionForm.setActionCode("");
				}else
				result=mapping.findForward("success");
			}
			else if("export".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)request.getAttribute("completionForm");
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=completions.xls");
				logger.info("exporting completions to excell");
				Vector<EmployeeCompletionBean> completions = (Vector<EmployeeCompletionBean>)request.getAttribute("completions");
				PrintWriter out = response.getWriter();
				if(completions!=null){
					EmployeeCompletionBean comp=null;
					out.print("שם נציג"+"\t");
					out.print("תעודת זהות"+"\t");
					out.print("צוות"+"\t");
					out.print("תאריך השלמה"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("סוג השלמה"+"\t");
					out.print("סטטוס"+"\t");
					out.print("מקור נתונים"+"\t");
					out.print("תאריך שינוי"+"\t");
					out.print("שם מעדכן"+"\n");
					
					for(int i=0;i<completions.size();i++){
						comp=completions.get(i);
						out.print(comp.getEmployeeName()+"\t");
						out.print(comp.getEmployeeIdNumber()+"\t");
						out.print(SHFTableUtils.getUnitName(comp.getTeam())+"\t");
						out.print(BaseConvert.dateToString(comp.getCompletionStart(),"dd/MM/yyyy")+"\t");
						out.print(BaseConvert.dateToString(comp.getCompletionStart(),"HH:mm")+"\t");
						out.print(BaseConvert.dateToString(comp.getCompletionEnd(),"HH:mm")+"\t");
						out.print(SHFTableUtils.getCompletionDesc(comp.getCode())+"\t");
						out.print(SHFConstants.COMPLETION_STATUS_MAP.get(comp.getSapStatus())+"\t");
						out.print(comp.getSource()+"\t");
						out.print(BaseConvert.dateToString(comp.getUpdateDate(),"dd/MM/yyyy HH:mm")+"\t");
						out.print(comp.getUserName());
						out.print("\n");
					}
				}
				out.close();
			}
			else if("cancel".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				if(searchCompletionForm.getSelectedCompletions()==null){
					System.out.println("selectCompletionForCancel exception");
					throw new ShfException(new ActionError("shf.error.selectCompletionForCancel"));
				}
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				Vector<EmployeeCompletionBean> completions = completion.populateSelectedCompletions();
				request.setAttribute("completions",completions);
				request.setAttribute("completionForm",searchCompletionForm);
				result=mapping.findForward("success");
			}
			else if("confirm_cancel".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				if(searchCompletionForm.getSelectedCompletions()==null){
					throw new ShfException(new ActionError("shf.error.selectCompletionForCancel"));
				}
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				completion.cancel();
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add("shf", new ActionError("shf.success.completionCancelled"));
				saveErrors(request,actionErrors);
				result=mapping.findForward("success");
			}
			else if("update".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				if(searchCompletionForm.getSelectedCompletions()==null){
					throw new ShfException(new ActionError("shf.error.selectCompletionForCancel"));
				}
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				Vector<EmployeeCompletionBean> completions = completion.populateSelectedCompletions();
				searchCompletionForm.setSelectedCompletions(new Integer[0]);
				request.setAttribute("completions",completions);
				request.setAttribute("completionForm",searchCompletionForm);
				result=mapping.findForward("success");
			}
			else if("confirm_update".equals(param)){
				CTISearchCompletionForm searchCompletionForm=(CTISearchCompletionForm)form;
				if(searchCompletionForm.getSelectedCompletions()==null){
					throw new ShfException(new ActionError("shf.error.selectCompletionForCancel"));
				}
				CTICompletion completion=new CTICompletion(searchCompletionForm);
				Vector errors=null;
				HashSet<String> set=null;
				try{
					set=new HashSet<String>();
					errors=completion.update(set);
					errors=EmployeeDataModel.populateEmployeesByCompletions((EmployeeCompletionBean[])errors.toArray(new EmployeeCompletionBean[errors.size()]));
				}catch (ShfException e) {
					throw e;
				}finally{
					request.setAttribute("completionForm",searchCompletionForm);
				}
				request.setAttribute("errorSet",set);
				request.setAttribute("errors",errors);
				
				result=mapping.findForward("success");
			}
			
			////////////////////////////// job to sap
			
			else if("view_job_sap".equals(param)){
				Vector<TableForm> available=new Vector<TableForm>();
				CTICompletion completion=new CTICompletion();
				Vector<TableForm> assigned = completion.getJobs(available);
				request.setAttribute("available",available);
				request.setAttribute("assigned",assigned);
				result=mapping.findForward("success");
			}
			else if("assign_job_sap".equals(param)){
				TableForm job=(TableForm)form;
				CTICompletion completion=new CTICompletion();
				completion.assignJob(job);
				result=mapping.findForward("success");
			}
			else if("unassign_job_sap".equals(param)){
				TableForm job=(TableForm)form;
				CTICompletion completion=new CTICompletion();
				completion.unAssignJob(job);
				result=mapping.findForward("success");
			}
			
		}catch (ShfException e) {
			saveErrors(request, e.getErrors());
			result=mapping.findForward("fail");
		}
		
		return result;
	}

}
