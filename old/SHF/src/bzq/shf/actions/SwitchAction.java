/*
 * Created on 09/06/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.util.Iterator;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.forms.SwitchForm;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.model.SwitchModel;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;
import bzq.utils.AppUtils;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SwitchAction extends BaseAction{

	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		
		if(param.equals("switch_shifts")){
			
			
			//----------- START ------------------------- Igal 5.2013
			if ("false".equals(request.getSession(false).getAttribute("switchLimit"))){ // No limitations (set in param=check)
																						// start switch agents
				try{
					HttpSession session = request.getSession(false);
					SwitchForm switchForm=(SwitchForm)form;
					AgentDayBean firstDay=((AgentDayBean)session.getAttribute("agentAbean"));
					AgentDayBean secondDay=((AgentDayBean)session.getAttribute("agentBbean"));
					firstDay.setUserFirstName(switchForm.getUserFirstName());
					firstDay.setUserId(switchForm.getUserId());
					firstDay.setUserLastName(switchForm.getUserLastName());
					
					SwitchModel switcher=new SwitchModel(firstDay,secondDay);
					
					switcher.replaceDays(getServlet().getServletContext());
					ShiftDataForm shiftDataForm=new ShiftDataForm();					
					shiftDataForm.setAttendanceDate(firstDay.getShiftStart());
					shiftDataForm.setTimeFrom(BaseConvert.dateToString(firstDay.getShiftStart(),"HH:mm"));
					shiftDataForm.setTimeTo(BaseConvert.dateToString(firstDay.getShiftStart(),"HH:mm"));
					request.setAttribute("shiftDataForm",shiftDataForm);
					request.setAttribute("firstDay",firstDay);
				
				} catch (ShfException e) {
					e.getErrors().get().next();
					if(e.getErrors()!=null){
						Iterator it=e.getErrors().get();
						if(it.hasNext()){
							ActionError error=(ActionError)it.next();
							if(error!=null)
								request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
						}
					}
					result=mapping.findForward("fail");
					return result;
				} 
				
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.switchSucceeded"));
				saveErrors(request,actionErrors);
				request.getSession(false).removeAttribute("switchLimit");
				request.getSession(false).removeAttribute("agentAbean");
				request.getSession(false).removeAttribute("agentBbean");
				
				result=mapping.findForward("success");
				return result;

			} else { // remove limitations and start switch agents
				try{
					HttpSession session = request.getSession(false);
					AgentDayBean firstDay=((AgentDayBean)session.getAttribute("agentAbean"));
					AgentDayBean secondDay=((AgentDayBean)session.getAttribute("agentBbean"));
					SwitchModel switcher=new SwitchModel(firstDay,secondDay);

					switcher.removeLimit(firstDay, secondDay, (UserProfile)session.getAttribute("userProfile"));
					
					} catch (ShfException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					request.getSession(false).setAttribute("switchLimit","false");

					result=mapping.findForward("removedLimit"); // redirect back to switch_shifts, but with switchLimit=false
					return result;
//				} catch (ShfException e) {
//					e.getErrors().get().next();
//					if(e.getErrors()!=null){
//						Iterator it=e.getErrors().get();
//						if(it.hasNext()){
//							ActionError error=(ActionError)it.next();
//							if(error!=null)
//								request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
//						}
//					}
//					result=mapping.findForward("fail");
//					return result;
//				} 
//				ActionErrors actionErrors=new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.switchSucceeded"));
//				saveErrors(request,actionErrors);
				
				
			} 
			//----------- END ------------------------- Igal 5.2013
			
			//---- old 
//			SwitchForm switchForm=(SwitchForm)form;
//			try{
//				AgentDayBean firstDay=ShiftDataModel.populateShift(switchForm.getFirstDayId());
//				AgentDayBean secondDay=ShiftDataModel.populateShift(switchForm.getSecondDayId());
//				
//				SwitchModel switcher=new SwitchModel(firstDay,secondDay);
//				switcher.replaceDays();
//				ShiftDataForm shiftDataForm=new ShiftDataForm();
//				
//				shiftDataForm.setAttendanceDate(firstDay.getShiftStart());
//				shiftDataForm.setTimeFrom(BaseConvert.dateToString(firstDay.getShiftStart(),"HH:mm"));
//				shiftDataForm.setTimeTo(BaseConvert.dateToString(firstDay.getShiftStart(),"HH:mm"));
//				request.setAttribute("shiftDataForm",shiftDataForm);
//			}catch(ShfException e){
//				e.getErrors().get().next();
//				if(e.getErrors()!=null){
//					Iterator it=e.getErrors().get();
//					if(it.hasNext()){
//						ActionError error=(ActionError)it.next();
//						if(error!=null)
//							request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
//					}
//				}
//				result=mapping.findForward("fail");
//				return result;
//			}
//			ActionErrors actionErrors=new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.switchSucceeded"));
//			saveErrors(request,actionErrors);
			
			
			//------
			
		}
		
		else if(param.equals("check")){ 
			
			SwitchForm switchForm=(SwitchForm)form;
			
			try {
				AgentDayBean firstDay=ShiftDataModel.populateShift(switchForm.getFirstDayId());
				AgentDayBean secondDay=ShiftDataModel.populateShift(switchForm.getSecondDayId());
				SwitchModel switcher=new SwitchModel(firstDay,secondDay,switchForm);
				
				if(switcher.validateReplace()){ // limitations occurred, ask for confirmation     
					HttpSession session = request.getSession(false);
					session.setAttribute("agentAbean", firstDay);
					session.setAttribute("agentBbean", secondDay);
					session.setAttribute("switchLimit","true");
					
					result=mapping.findForward("confirm");
//					return result;
				}
				else { // no limitations for agent switch, commence agent switch
					HttpSession session = request.getSession(false);
					session.setAttribute("agentAbean", firstDay);
					session.setAttribute("agentBbean", secondDay);
					session.setAttribute("switchLimit","false");
					
					result=mapping.findForward("success");
//					return result;
				}
				
				request.setAttribute("switchForm",switchForm);
				
				return result;				
				
			} catch (ShfException e) {

				e.getErrors().get().next();
				if(e.getErrors()!=null){
					Iterator it=e.getErrors().get();
					if(it.hasNext()){
						ActionError error=(ActionError)it.next();
						if(error!=null)
							request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
					}
				}
				result=mapping.findForward("fail");
				return result;
			
			}
			
			
//			try{
//				AgentDayBean firstDay=ShiftDataModel.populateShift(shiftDataForm.getAgentDayId());
//				SwitchModel switchModel=new SwitchModel(firstDay,null);
//				switchModel.checkFirst(shiftDataForm.getAgentDayId()); 
//				result=mapping.findForward("success");
//				request.setAttribute("firstDay",firstDay);
//			}catch(ShfException e){
//				e.getErrors().get().next();
//				if(e.getErrors()!=null){
//					Iterator it=e.getErrors().get();
//					if(it.hasNext()){
//						ActionError error=(ActionError)it.next();
//						if(error!=null)
//							request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
//					}
//				}
//				result=mapping.findForward("fail");
//			}
			
			
						
			
			
		}
		
		else if (param.equals("sec_shift")){
			ShiftDataForm shiftDataForm=(ShiftDataForm)form;
			try{
				AgentDayBean firstDay=ShiftDataModel.populateShift(shiftDataForm.getAgentDayId());
				result=mapping.findForward("success");
				request.setAttribute("firstDay",firstDay);
				return result;
			}catch(ShfException e){
				e.getErrors().get().next();
				if(e.getErrors()!=null){
					Iterator it=e.getErrors().get();
					if(it.hasNext()){
						ActionError error=(ActionError)it.next();
						if(error!=null)
							request.setAttribute("error",AppUtils.message(error.getKey(),error.getValues()));
					}
				}
				result=mapping.findForward("fail");
			}
			
		}
		
		else if (param.equals("usrCancelForcedSwitch")){
			request.getSession(false).removeAttribute("switchLimit");
			request.getSession(false).removeAttribute("agentAbean");
			request.getSession(false).removeAttribute("agentBbean");
			
			result=mapping.findForward("success");
			return result;
			
		}
		
		return result;
	}

}
