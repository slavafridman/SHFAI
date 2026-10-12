/*
 * Created on 12/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import org.w3c.dom.Document;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.BreakCandidateBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.forms.BreakSearchForm;
import bzq.shf.forms.ShiftBreakForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.model.BreakDataModel;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TibcoQueueMessageSender;
import bzq.utils.BaseConvert;

import bzq.shfsp.request.SHFSPBreaks;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BreakDataAction extends BaseAction{

	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		BreakDataModel breakModel=new BreakDataModel();
		HttpSession session=request.getSession();
		BreakSearchForm breakForm = null;
		
		if(param.equals("search_param")){
			breakForm = (BreakSearchForm)form;
			
			BreakSearchForm storedBreakForm=(BreakSearchForm)session.getAttribute("breakForm");
			if(storedBreakForm==null){
				breakModel.setCurrentDefaults(breakForm);
			}else{
				breakForm.copyForm(storedBreakForm);
			}
			result=mapping.findForward("success");
			request.setAttribute("breakForm",breakForm);
		}
		else if(param.equals("search_result")){
			breakForm = (BreakSearchForm)form;
			session.setAttribute("breakForm", breakForm);
			breakForm.setRefhreshed_time(breakModel.getCurentTime());
			try{
				breakModel.populateAllBreaksInRange(breakForm);
				breakModel.populateTabs(breakForm);
					
				result=mapping.findForward("success");
				request.setAttribute("breakForm",breakForm);
			}catch(ShfException e){
				saveErrors(request,e.getErrors());	
			}
			
		} 	
		else if(param.equals("export")){
			breakForm = (BreakSearchForm)form;
			breakForm.setRefhreshed_time(breakModel.getCurentTime());
			response.setContentType("application/msexcel");
			response.setHeader("Content-Disposition","atachment;filename=breaks_table.xls");
			logger.info("exporting breaks to excell");
			try{
				breakModel.populateAllBreaksInRange(breakForm);
				breakModel.populateTabs(breakForm);
				HashMap allBreaks=breakForm.getAllTab();
				PrintWriter out = response.getWriter();
				Vector vector=null;
				Iterator it = allBreaks.keySet().iterator();
				while(it.hasNext()){
				
					String key=(String)it.next();
					vector=(Vector)allBreaks.get(key);
					//logger.info(key+" - "+vector.size());
					
					if(vector!=null){
						
						out.print(SHFConstants.BREAKS_TABS.get(key)+"\n");
						BreakBean breakBean=null;
						out.print("יום"+"\t");
						out.print("תאריך"+"\t");
						out.print("שם"+"\t");
						out.print("שעת התחלה"+"\t");
						out.print("שעת סיום"+"\t");
						out.print("שעת יציאה"+"\t");
						out.print("שעת חזרה"+"\t");
						out.print("תפקיד בפועל"+"\t");
						out.print("תור"+"\t");
						out.print("איחור בדקות"+"\t");
						out.print("הערות להפסקה"+"\n");
						
						for(int i=0;i<vector.size();i++){
							breakBean=(BreakBean)vector.get(i);
							out.print(SHFUtils.getDayOfWeek(breakBean.getStartTime())+"\t");
							out.print(BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy")+"\t");
							out.print(breakBean.getFirstName()+" "+breakBean.getLastName() +"\t");
							out.print(BaseConvert.dateToString(breakBean.getStartTime(),"HH:mm")+"\t");
							out.print(BaseConvert.dateToString(breakBean.getEndTime(),"HH:mm")+"\t");
							out.print(BaseConvert.dateToString(breakBean.getExitTime(),"HH:mm")+"\t");
							out.print(BaseConvert.dateToString(breakBean.getEntryTime(),"HH:mm")+"\t");
							out.print(SHFTableUtils.getInnerJobName(breakBean.getInnerJobId()) +"\t");
							out.print(SHFTableUtils.getActivityNamesExport(breakBean.getActivity()) +"\t");
							out.print((breakBean.getMinuteLate()>0?String.valueOf(breakBean.getMinuteLate()):"") +"\t");
							out.print(breakBean.getBreakRemark());
							
							out.print("\n");
						}
						out.print("\n\n");
					}
					
				}
				
				out.close();
				
			}catch (ShfException e) {
				//saveErrors(request,e.getErrors());
			}
		}

		else if(param.equals("break_shift")){
			response.setHeader("Cache-Control","no-cache");
			response.setHeader("Pragma","no-cache"); 
			BreakBean breakBean = null;
			Vector resVec = null;
			breakBean = (BreakBean)form;
			try{
				resVec = BreakDataModel.populateBreaksForShift(breakBean.getAgentDayId());
				request.setAttribute("breakBean",breakBean);
				request.setAttribute("resVec", resVec);
				result=mapping.findForward("success");
			}catch(ShfException e){
	
			}
		}
		
		else if(param.equals("exit_to_break")){
			BreakBean breakBean = null;
			try{
				breakBean=(BreakBean)form;
				String min=SHFParameters.getMinimalBreakShifting(breakBean.getAllowedMoked()).getValue();
				int minmin=Integer.parseInt(min);
				Date now=new Date();
				breakBean.setExitTime(now);
				int diff=SHFUtils.getMinutesBetween(breakBean.getStartTime(), now);
				if(diff>minmin){
					logger.info("Break start event for shift: "+breakBean.getAgentDayId()+" break started: "+BaseConvert.dateToString(now, "HH:mm")+" instead of "+ BaseConvert.dateToString(breakBean.getStartTime(), "HH:mm"));
				}
				breakModel.exitToBreak(breakBean);
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
			result=mapping.findForward("success");
		}

		else if(param.equals("back_from_break")){
			try{
				BreakBean breakInfo=(BreakBean)form;
				Date now=new Date();
				breakInfo.setEntryTime(now);
				try{
					breakModel.checkLate(breakInfo);
				}catch(ShfException e){
					logger.error("error while checking late from break: "+e.getMessage());
					logger.error("break details: agentDay="+breakInfo.getAgentDayId()+" start= "+breakInfo.getStartTime());
				}
				breakModel.backFromBreak(breakInfo);
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
			result=mapping.findForward("success");
		}
		
		else if(param.equals("check_break")){
			response.setHeader("Cache-Control","no-cache");
			response.setHeader("Pragma","no-cache"); 
			
			long dayId;
			Date startDate;
			BreakBean breakBean = null;
			breakBean = (BreakBean)form;
								
			BreakBean breakInfo=(BreakBean)form;
			try{
				breakModel.checkValidBreakCandidate(breakInfo);
				result=mapping.findForward("success");
			}catch(ShfException e){	
				result=mapping.findForward("fail");
				saveErrors(request,e.getErrors());
			}		
		}
		
		else if(param.equals("change_break")){
			response.setHeader("Cache-Control","no-cache");
			response.setHeader("Pragma","no-cache"); 
			try{
				long dayId;
				Date startDate=null;
				BreakBean breakBean = null;
				breakBean = (BreakBean)form;
				Vector retVec = null;
				ShiftDataForm shiftForm = new ShiftDataForm();
				ShiftDataModel shiftsModel = null;
				
				((ShiftDataForm)shiftForm).setAgentDayId(breakBean.getAgentDayId());
				shiftsModel=new ShiftDataModel(shiftForm);
				
				try {
					shiftsModel.populateShiftForUpdate();
				} catch(ShfException ee) {
					saveErrors(request, ee.getErrors());
					result = mapping.findForward("fail");
					return result;
				}
				retVec = breakModel.checkCandidate(shiftForm, breakBean); 
				request.setAttribute("breakVec", retVec);
				request.setAttribute("breakBean", breakBean);
				Vector breaks=BreakDataModel.populateBreaksForShift(shiftForm.getAgentDayId());
				request.setAttribute("shiftBreaks",breaks);
				
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
				result=mapping.findForward("success");
		}
		
		else if(param.equals("select_offer")){
			try{
				long dayId;
				Date startDate=null;
				BreakBean breakBean = null;
				breakBean = (BreakBean)form;
				Vector retVec = null;
				
				retVec = breakModel.populateBreakOffer(breakBean); 
				request.setAttribute("breakVec", retVec);
				request.setAttribute("breakBean", breakBean);
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}		
		
		else if(param.equals("insert_break")){
			try{
				long dayId;
				Date startDate=null;
				BreakBean breakBean = null;
				breakBean = (BreakBean)form;
				Vector retVec = null;
				
				breakModel.insertBreakAsCandidate(breakBean);
				breakModel.updateExceptionSource(breakBean.getAgentDayId(), breakBean.getStartTime(), "SHF");
				request.setAttribute("breakVec", retVec);
				request.setAttribute("breakBean", breakBean);
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}

		else if(param.equals("ask_replace_break")){
			try{
				long dayId;
				Date startDate=null;
				BreakCandidateBean breakCaBean = null;
				breakCaBean = (BreakCandidateBean)form;
				
				BreakBean breakBean = null;
				breakBean = (BreakBean)form;
				Vector retVec = null;
				
				if (breakCaBean.getIsNewCandidate() == 1)
					{
						breakModel.insertBreakAsCandidateOffer(breakCaBean);
						result=mapping.findForward("successNew");
					}
				else
					{
						breakModel.updateBreakForChange(breakCaBean);
						result=mapping.findForward("successExist");
					}
				breakModel.writeMassageForBreak(breakCaBean, SHFConstants.ASK_FOR_REPLACE);	
				request.setAttribute("breakVec", retVec);
				request.setAttribute("breakBean", breakCaBean);
				//result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}
		
		else if(param.equals("manage_break")){
			try{
//				long dayId;
//				Date startDate=null;
				BreakCandidateBean breakCandidateBean = null;
				breakCandidateBean = (BreakCandidateBean)form;
				
//				BreakBean breakBean = null;
//				breakBean = (BreakBean)form;
				Vector retVec = null;
				String userId=null;
				if(breakCandidateBean.getAllowedActivities().contains("replace_agent")){
					userId=breakCandidateBean.getUserId();
				}
				retVec = breakModel.populateCandidateForManage(userId,breakCandidateBean);
				request.setAttribute("breakCaBean", retVec);
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}
		
		else if(param.equals("cancel_break_offer")){
			try{
				long dayId;
				Date startDate=null;
				BreakCandidateBean breakCaBean = null;
				breakCaBean = (BreakCandidateBean)form;
				
				breakModel.cancelMyBreakOffer(breakCaBean);
				breakModel.writeMassageForBreak(breakCaBean, SHFConstants.CANCEL_OFFER);	
				
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}
		
		else if(param.equals("reject_break_offer")){
			try{
				long dayId;
				Date startDate=null;
				BreakCandidateBean breakCaBean = null;
				breakCaBean = (BreakCandidateBean)form;
				breakModel.rejectBreakOffer(breakCaBean);
				breakModel.writeMassageForBreak(breakCaBean, SHFConstants.REJECT_OFFER);
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}

		else if(param.equals("accept_break_offer")){
			try{
				BreakCandidateBean breakCaBean = null;
				breakCaBean = (BreakCandidateBean)form;
//				breakModel.writeMassageForBreak(breakCaBean, SHFConstants.ACCEPT_OFFER);
//				Vector messages=breakModel.rejectAllBreakOffer(breakCaBean);
//				breakModel.writeMassageForBreakVector(messages, SHFConstants.REJECT_OFFER);
				result = mapping.findForward("success");
				breakModel.switchBetweenBreaks(breakCaBean, getServlet().getServletContext());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchSuccessful", null));
				saveErrors(request,actionErrors);
				
				
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}
				
		else if(param.equals("cancel_break_cand")){
			try{
				long dayId;
				Date startDate=null;
				BreakCandidateBean breakCandidateBean = null;
				breakCandidateBean = (BreakCandidateBean)form;
				Vector messages=breakModel.rejectAllBreakOffer(breakCandidateBean);
				breakModel.writeMassageForBreakVector(messages, SHFConstants.REJECT_OFFER);	
				breakModel.deleteBreakCandidate(breakCandidateBean);
				breakModel.updateExceptionSource(breakCandidateBean.getAgentDayId(), breakCandidateBean.getStartTime(), "WFM");
				result=mapping.findForward("success");
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
		}
		
		else if(param.equals("update_shift_break")){
			
			try{
				
				ShiftBreakForm shiftBreakForm=(ShiftBreakForm)form;
				
				// Update breaks at shifter side
				shiftBreakForm.setModificationTime(new Date());
				shiftBreakForm.setModificationUser(shiftBreakForm.getUserFirstName() + " " + shiftBreakForm.getUserLastName());
				breakModel.setsCtx(getServlet().getServletContext());
				breakModel.updateShiftBreaks(shiftBreakForm);	// if this fails(exception), then it will be caught by general catch and thus message to TIBCO wont be send
				
				
				
				request.setAttribute("shiftForm",shiftBreakForm);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.breakUpdated"));
				saveErrors(request,actionErrors);
			}catch(ShfException e){
				saveErrors(request,e.getErrors());
			}
			result=mapping.findForward("success");
		}
		
		return result;
	}

}
