/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ShiftReduceListForm;
import bzq.shf.forms.ShiftReduceRequestForm;
import bzq.shf.model.ReduceDataModel;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReduceDataAction extends BaseAction{
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		ShiftReduceRequestForm reduceRequestForm = null;
		ShiftReduceListForm reduceListForm = null;
		ReduceDataModel reduceModel = new ReduceDataModel();

		try {		
			if (param.equals("reduce_request")) {
				
				Vector reduceVec = null;
				reduceRequestForm = (ShiftReduceRequestForm)form;
				reduceModel.setRequestCurrentDefaults(reduceRequestForm);
				reduceVec = reduceModel.populateReduceRequest(reduceRequestForm);
				
				if("export".equals(reduceRequestForm.getMode())){
					response.setContentType("application/msexcel");
					response.setHeader("Content-Disposition","atachment;filename=reduce_repository_table.xls");
					PrintWriter out = response.getWriter();
					exportRepository(reduceVec,out);
					return null;
				}
				
				if(reduceVec!=null && reduceVec.size()>0){
					for(int i=0;i<reduceVec.size();i++){
						reduceModel.populateAddRequestReduce((ShiftReduceRequestForm)reduceVec.get(i));
					}
				}
				
				result=mapping.findForward("success");
				
				request.setAttribute("reduceVec",reduceVec);
			} 
			else if (param.equals("reduce_result")) {
				logger.debug("Yuval - reduce_result");
				Vector reduceVec = null;
				reduceRequestForm = (ShiftReduceRequestForm)form;
				
				reduceModel.populateToReduce(reduceRequestForm);
				
				request.setAttribute("reduceRequestForm",reduceRequestForm);
			
				result=mapping.findForward("success");
								
		   } 
			else if (param.equals("reduce_result_option")) {
				logger.debug("reduce_result_option");
				Vector optionVec = null;
				reduceRequestForm = (ShiftReduceRequestForm)form;
				
				reduceModel.setRequestCurrentDefaults(reduceRequestForm);				
				optionVec = reduceModel.populateReduceRequest(reduceRequestForm);
				
				if(optionVec!=null && optionVec.size()>0){
					for(int i=0;i<optionVec.size();i++){
						reduceModel.searchReduceOptions((ShiftReduceRequestForm)optionVec.get(i), reduceRequestForm);
						reduceModel.getSumApprovedReduceRequest((ShiftReduceRequestForm)optionVec.get(i));
					}
				}
				request.setAttribute("optionVec",optionVec);
				result=mapping.findForward("success");		
		  } 
			else if (param.equals("add_reduce")) {
				logger.debug("Yuval - add_reduce");
				reduceListForm = (ShiftReduceListForm)form;
				//TODO aad check for time parameter 
				try {
					reduceModel.checkIfAllowedCancelShiftForReduce(reduceListForm); //throws exception if not allowed for cancel
					reduceModel.addReduceCandidate(reduceListForm);
					
					if ("1".equals(reduceListForm.getAutomaticApprove()) || "reduce_shift".equals(reduceListForm.getSourceWindow()) ) {
						reduceModel.cancelShiftForReduce(reduceListForm);
						reduceModel.writeMassageForReduce(reduceListForm, SHFConstants.APPROVE_REDUCE);
					}
				} catch (ShfException e ) {
						saveErrors(request,  e.getErrors());
					}
					
				if ( "reduce_shift".equals(reduceListForm.getSourceWindow()) ) {
					result=mapping.findForward("success_shift");
				} else if ("reduce_option".equals(reduceListForm.getSourceWindow())) {
					result=mapping.findForward("success_option");
				}
		  } 
			else if (param.equals("approve_decline")) {
				logger.debug("approve_decline");
				
				reduceListForm = (ShiftReduceListForm)form;
				AgentDayBean day = ShiftDataModel.populateShift(reduceListForm.getAgentDayId());
				
				reduceListForm.setDate(day.getShiftStart());
				reduceListForm.setWmShiftStartTime(day.getDayStart());
				reduceListForm.setWmShiftEndTime(day.getDayEnd());
				
				if (reduceListForm.getMode().equals("0")) {
					reduceModel.declineReduce(reduceListForm);
					reduceModel.writeMassageForReduce(reduceListForm, SHFConstants.DECLINE_REDUCE);
				} else if (reduceListForm.getMode().equals("1")) {
						try {
							reduceModel.checkIfAllowedCancelShiftForReduce(reduceListForm); //throws exception if not allowed for cancel
							reduceModel.cancelShiftForReduce(reduceListForm);
						} catch (ShfException e) {
							saveErrors(request,e.getErrors());
							} 
						reduceModel.writeMassageForReduce(reduceListForm, SHFConstants.APPROVE_REDUCE);
				}
				result=mapping.findForward("success");
		}
			else if (param.equals("decline_all")) {
				logger.debug("decline_all");
				reduceRequestForm = (ShiftReduceRequestForm)form;
				reduceModel.declineAllNotApproved(reduceRequestForm);
				
				result=mapping.findForward("success");
			}
			
			else if (param.equals("add_reduce_param")) {
				
				logger.debug("update reduce");
				
				result=mapping.findForward("success");
			}
			
			else if (param.equals("add_update_reduce")) {
				
				logger.debug("add_update_reduce");

				reduceRequestForm = (ShiftReduceRequestForm)form;
				String mode = reduceRequestForm.getMode();
				logger.debug("add_update_reduce MODE - " + mode);
				

				if (mode.equals("duplicate")) {
					reduceRequestForm = reduceModel.getReduceForUpdateOrView(reduceRequestForm.getReduceId());
					reduceRequestForm.setSumApproved(0);
					reduceRequestForm.setMode("viewForDuplicate");
					result=mapping.findForward("success");
				}
				if (mode.equals("viewForUpdate")) {
					reduceRequestForm = reduceModel.getReduceForUpdateOrView(reduceRequestForm.getReduceId());
					reduceModel.getSumApprovedReduceRequest(reduceRequestForm);
					reduceRequestForm.setMode("viewForUpdate");
					result=mapping.findForward("success");
				}
				if (mode.equals("update")) {
					reduceRequestForm.setMode("viewForUpdate");
					reduceModel.updateReduceReq(reduceRequestForm);
					result=mapping.findForward("successReturn");
				}
				if (mode.equals("update_decline")) {
					reduceModel.declineAllNotApproved(reduceRequestForm);
					reduceModel.updateReduceReq(reduceRequestForm);
					result=mapping.findForward("successReturn");
				}
				if (mode.equals("update_agent")) {
					reduceModel.updateReduceReqNumOfAgent(reduceRequestForm);
					result=mapping.findForward("successReturn");
				}
				if (mode.equals("update_agent_decline")) {
					reduceModel.declineAllNotApproved(reduceRequestForm);
					reduceModel.updateReduceReqNumOfAgent(reduceRequestForm);
					result=mapping.findForward("successReturn");
				}				
				if (mode.equals("viewForInsert")) {
					reduceModel.setRequestInsertDefaults(reduceRequestForm);
					reduceRequestForm.setMode("viewForInsert");
					result=mapping.findForward("success");
				}				 
				if (mode.equals("insert")) {
					reduceRequestForm.setMode("viewForInsert");
					reduceModel.addReduceReq(reduceRequestForm);
					result=mapping.findForward("successReturn");
				}
				if (mode.equals("delete")) {
					//DECLINE ALL NOT APPROVED REQUEST
					reduceModel.declineAllNotApproved(reduceRequestForm);

					//DELETE REQUEST					
					reduceModel.deleteReduceReq(reduceRequestForm);
					reduceRequestForm.setMode("delete");
					result=mapping.findForward("successReturn");
				}				
			}
		
			
		} catch (ShfException e) {
			saveErrors(request,e.getErrors());
			result=mapping.findForward("fail");
		}
		
		request.setAttribute("reduceRequestForm",reduceRequestForm);
		return result;		
	}
	
	private void exportRepository(Vector vector,PrintWriter out){
		
		if(vector!=null){
			ShiftReduceRequestForm reduce=null;
			out.print("תדריך"+"\t");
			out.print("שעת התחלה"+"\t");
			out.print("שעת סיום"+"\t");
			out.print("מוקד"+"\t");
			out.print("תור"+"\t");
			out.print("מספר מקומות"+"\t");
			out.print("סוג אישור"+"\t");
			out.print("עודכן ע\"י" + "\t");
			out.print("תאריך יצירה"+"\n");
			
			for(int i=0;i<vector.size();i++){
				reduce=(ShiftReduceRequestForm)vector.get(i);
				out.print(BaseConvert.dateToString(reduce.getShiftStart(),"dd/MM/yyyy") + "\t");
				out.print(BaseConvert.dateToString(reduce.getShiftStart(),"HH:mm") + "\t");
				out.print(BaseConvert.dateToString(reduce.getShiftEnd(),"HH:mm") + "\t");
				out.print(SHFTableUtils.getUnitName(reduce.getMokedId()) + "\t");
				out.print(SHFTableUtils.getActivityName(reduce.getActivity())+ "\t");
				out.print(reduce.getNumberOfAgets() + "\t");
				out.print(("1".equals(reduce.getAutomaticApprove())?"אוטומטי":"ידני") + "\t");
				out.print(reduce.getModifyUser() + "\t");
				out.print(BaseConvert.dateToString(reduce.getCreationTime(),"dd/MM/yyyy - HH:mm"));
				out.print("\n");
			}
		}
		out.close();
	}

}
