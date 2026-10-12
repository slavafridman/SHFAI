/*
 * Created on 07/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.apache.commons.validator.GenericValidator;
import org.apache.log4j.Logger;
import org.apache.struts.action.Action;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import org.apache.struts.util.MessageResources;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.ChangeRequestCandidate;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.ExceptionActivityBean;
import bzq.shf.bean.ExceptionBean;
import bzq.shf.bean.PoolExtAllocBean;
import bzq.shf.bean.PotentialEmployeeBean;
import bzq.shf.bean.ShfBaseBean;
import bzq.shf.forms.AddShiftForm;
import bzq.shf.forms.AddShiftRequestForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EmployeeExceptionForm;
import bzq.shf.forms.PotentialInforceForm;
import bzq.shf.forms.ShiftChangeRequestForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.forms.ShiftInforceRequestForm;
import bzq.shf.forms.ShiftLoginCancelForm;
import bzq.shf.model.BreakDataModel;
import bzq.shf.model.ExceptionDataModel;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.AppResources;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftDataAction extends BaseAction{
	
	private static Logger logger=Logger.getLogger(ShiftDataAction.class);
	private ShiftDataModel shiftsModel = null;
		
	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		ShiftDataForm shiftsForm = null;// = new ShiftDataForm();
		ShiftInforceRequestForm shiftInforce=null;
		HttpSession session=request.getSession();
		logger.info("ShiftDataAction: param="+param);
	
		try {

			if(param.equals("menu")){
				ShfBaseBean bean=(ShfBaseBean)form;
				if(bean.getAllowedActivities().contains("shift_current"))
					result=mapping.findForward("success_manager");	
				else if(bean.getAllowedActivities().contains("shift_myshifts"))
					result=mapping.findForward("success_agent");	
				else
					result=mapping.findForward("security");	
			}
			else if(param.equals("getShift")){
				shiftsForm=(ShiftDataForm)form;
				AgentDayBean day=ShiftDataModel.populateShift(shiftsForm.getAgentDayId());
				request.setAttribute("originalDay", day);
				result=mapping.findForward("success");	
			}
			else if(param.equals("param")){
				shiftsForm=(ShiftDataForm)form;
				ShiftDataForm storedShiftsForm = (ShiftDataForm)request.getSession().getAttribute("shiftsForm");
				if(storedShiftsForm==null){
					shiftsModel=new ShiftDataModel(shiftsForm);
					shiftsModel.setFormDefaults();
				}else{
					((ShiftDataForm)shiftsForm).copyForm(storedShiftsForm);
				}
				result=mapping.findForward("success");	
			}
			else if(param.equals("result")){
				shiftsForm=(ShiftDataForm)form;
				request.getSession().setAttribute("shiftsForm",shiftsForm);
				shiftsModel=new ShiftDataModel(shiftsForm);
				Vector vec=shiftsModel.populateShiftList();
				request.setAttribute("shifts_list",vec);
				result=mapping.findForward("success");	
			}
			else if(param.equals("current_param")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				shiftsModel.setFormDefaults();
				result=mapping.findForward("success");	
			}
			else if(param.equals("current_result")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				if("1".equals(((ShiftDataForm)shiftsForm).getCbChecked())){
					shiftsModel.setCurrentDefaults();	
				}
				Vector vec=shiftsModel.populateCurrentShift();
				request.setAttribute("shifts_list",vec);
				result=mapping.findForward("success");	
			} 
			else if(param.equals("my_param")){
				shiftsForm=(ShiftDataForm)form;
				int weekAGo=1;
				java.util.Date dayDate= new Date();/*bzq.shf.utils.SHFUtils.getLastNWeekDate(weekAGo);*/
				shiftsForm.setNewShiftStart(dayDate);
				result=mapping.findForward("success");	
			}
			else if(param.equals("my_result")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				Vector vec=shiftsModel.populateMyShifts();
				request.setAttribute("shifts_list",vec);
				boolean replaceAllowed=false;
				if(vec!=null && vec.size()>0){
					AgentDayBean day=(AgentDayBean)vec.get(0);
					replaceAllowed=day.getReplaceAllowed()==1;
				}
				request.setAttribute("replaceAllowed",new Boolean(replaceAllowed));
				result=mapping.findForward("success");	
			}
			else if(param.equals("exportMyShifts")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				Vector shifts=shiftsModel.populateMyShifts();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=shifts_table.xls");
				logger.info("exporting shifts to excell");
				
				PrintWriter out = response.getWriter();
				if(shifts!=null){
					AgentDayBean day=null;
					out.print("יום"+"\t");
					out.print("תאריך"+"\t");
					out.print("שם"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("תור"+"\t");
					out.print("צוות"+"\n");
					
					
					
					for(int i=0;i<shifts.size();i++){
						day=(AgentDayBean)shifts.get(i);
						
						out.print(SHFUtils.getDayOfWeek(day.getShiftStart())+"\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy")+"\t");
						out.print(day.getFullName()+"\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"HH:mm")+"\t");
						out.print(BaseConvert.dateToString(day.getShiftEnd(),"HH:mm")+"\t");
						out.print(SHFTableUtils.getActivityName(day.getShiftActivity()) +"\t");
						out.print(SHFTableUtils.getUnitName(day.getOrgUnitCode())+"\t");
						out.print("\n");
					}
				}
				out.close();
			}
			else if(param.equals("inforce_request")){
				shiftInforce=(ShiftInforceRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftInforce);
				Vector v=null;
				try{
					new String(param);
					v=shiftsModel.doAction();
				}catch(ShfException e){
					request.setAttribute("shiftInforce",shiftInforce);
					saveErrors(request,e.getErrors());
					result=mapping.findForward("fail");
					return result;
				}
  								
				request.setAttribute("shiftInforce",shiftInforce);
				if(shiftInforce.getMode().equals("update_view")) 
					result=mapping.findForward("success_update");
				else{
					request.setAttribute("inforces",v);
					result=mapping.findForward("success");
				}	
			}
			else if(param.equals("exportInforce")){
				shiftInforce=(ShiftInforceRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftInforce);
				Vector vector = shiftsModel.populateShiftAddRequests();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=inforce_repository_table.xls");
				PrintWriter out = response.getWriter();
				if(vector!=null){
					ShiftInforceRequestForm inforce=null;
					out.print("תדריך"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("מוקד"+"\t");
					out.print("תור"+"\t");
					out.print("סקיל"+"\t");
					out.print("מספר מקומות"+"\t");
					out.print("נוצר ע\"י"+"\t");
					out.print("תאריך יצירה"+"\n");
					
					for(int i=0;i<vector.size();i++){
						inforce=(ShiftInforceRequestForm)vector.get(i);
						out.print(BaseConvert.dateToString(inforce.getShiftStart(),"dd/MM/yyyy") + "\t");
						out.print(BaseConvert.dateToString(inforce.getShiftStart(),"HH:mm") + "\t");
						out.print(BaseConvert.dateToString(inforce.getShiftEnd(),"HH:mm") + "\t");
						out.print(SHFTableUtils.getUnitName(inforce.getMoked()) + "\t");
						out.print(SHFTableUtils.getActivityName(inforce.getActivity())+ "\t");
						out.print(SHFTableUtils.getSkillName(String.valueOf(inforce.getSkill())) + "\t");
						out.print(inforce.getOriginalNumOfAgents() + "\t");
						out.print(inforce.getUser() + "\t");
						out.print(BaseConvert.dateToString(inforce.getCreationTime(),"dd/MM/yyyy - HH:mm"));
						out.print("\n");
					}
				}
				out.close();
			}
			else if(param.equals("add_inforce_param")){
				shiftInforce=(ShiftInforceRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftInforce);
				shiftsModel.setAddInforceDefaults();
				request.setAttribute("shiftInforce",shiftInforce);
				result=mapping.findForward("success");
			}
			else if(param.equals("search_potential_inforce_param")){
				PotentialInforceForm potentailInforce = new PotentialInforceForm();
				potentailInforce=(PotentialInforceForm)form;
				PotentialInforceForm storedPotentailInforce = (PotentialInforceForm)request.getSession().getAttribute("potentialInforceForm");
				
				if(storedPotentailInforce==null){
					shiftsModel=new ShiftDataModel(potentailInforce);
					shiftsModel.setSearchInforceOptionDefaults();
				} else {
					((PotentialInforceForm)potentailInforce).copyForm(storedPotentailInforce);
				}
				
				request.setAttribute("potentialInforce",potentailInforce);
				result=mapping.findForward("success");
			}
			else if(param.equals("search_potential_inforce_data")){
				PotentialInforceForm potentialInforce = new PotentialInforceForm();
				potentialInforce=(PotentialInforceForm)form;
				
				if (potentialInforce.getDate() == null) {
					potentialInforce = (PotentialInforceForm)request.getSession().getAttribute("potentialInforceForm");
				} else {
					request.getSession().setAttribute("potentialInforceForm",potentialInforce);
				}
				
				AddShiftForm addShiftForm= new AddShiftForm();
				addShiftForm=(AddShiftForm)request.getAttribute("addShiftForm");
				if(addShiftForm !=null && addShiftForm.getSourceActivity().equals("close")){
					try{ 
					potentialInforce.setEndPotential(BaseConvert.stringToDate(addShiftForm.getDate()+" " +addShiftForm.getShiftEnd(),"dd/MM/yyy HH:mm"));
					potentialInforce.setStartPotential(BaseConvert.stringToDate(addShiftForm.getDate()+"  "+addShiftForm.getShiftStart(),"dd/MM/yyy HH:mm"));
					} catch (ConvertException e1) {
						logger.error(e1.getMessage());
						throw new ShfException(new ActionError("shf.error.general"));
					}					
				}
				Vector potentialInforceData = null;
				shiftsModel=new ShiftDataModel(potentialInforce);
				new PotentialInforceForm();
				potentialInforceData = shiftsModel.getUserPotentailForInforce();
				potentialInforce.setPotentialInforceData(potentialInforceData);
				request.setAttribute("potentialInforce",potentialInforce);
				request.setAttribute("potentialInforceForm",potentialInforce);
				result=mapping.findForward("success");
			}
			else if(param.equals("search_potential_inforce_add")){
				PotentialInforceForm potentialInforce = new PotentialInforceForm();
				potentialInforce=(PotentialInforceForm)form;
				Vector potentialInforceData = null;
				shiftsModel=new ShiftDataModel(potentialInforce);
//				new PotentialInforceForm();
				potentialInforceData = shiftsModel.getUserPotentailForInforce();
				try{
					potentialInforceData = shiftsModel.getSelectedPotential(potentialInforceData);
					potentialInforce.setPotentialInforceData(potentialInforceData);
					//shiftsModel.setValidRangeForPotential();
					request.setAttribute("potentialInforce",potentialInforce);
					result=mapping.findForward("success");
				}catch (ShfException e) {
					potentialInforce.setPotentialInforceData(potentialInforceData);
					saveErrors(request,e.getErrors());
					request.setAttribute("potentialInforce",potentialInforce);
					result=mapping.findForward("fail");
				}
				return result;
			}
			else if (param.equals("export_potentail")) {
				PotentialInforceForm potentialInforce = new PotentialInforceForm();
				potentialInforce=(PotentialInforceForm)form;
				Vector potentialInforceData = null;
				EmployeeBean empBen = null;
				shiftsModel=new ShiftDataModel(potentialInforce);
				new PotentialInforceForm();
				potentialInforceData = shiftsModel.getUserPotentailForInforce();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=inforce_repository_table.xls");
				PrintWriter out = response.getWriter();
				if(potentialInforceData!=null){
					PotentialEmployeeBean inforce=null;
					out.print("יום"+"\t");
					out.print("שם"+"\t");
					out.print("זמין משעה"+"\t");
					out.print("זמין עד שעה"+"\t");
					out.print("צוות"+"\t");
					out.print("אחוז משרה"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("עובד מהבית"+"\t");
					out.print("מסורתי"+"\t");
					out.print("טל נייד"+"\t");
					out.print("טל נוסף"+"\t");
					out.print("עיר"+"\n");

					for(int i=0;i<potentialInforceData.size();i++){
						inforce=(PotentialEmployeeBean)potentialInforceData.get(i);
						empBen = inforce.getEmployeeBean();
						out.print(SHFUtils.getDayOfWeek(inforce.getStart_Potential()) + "\t");
						out.print(empBen.getFname() + " " + empBen.getLname() + "\t");
						out.print(BaseConvert.dateToString(inforce.getStart_Potential(),"HH:mm") + "\t");
						out.print(BaseConvert.dateToString(inforce.getEnd_Potential(),"HH:mm") + "\t");
						out.print(SHFTableUtils.getUnitName(empBen.getOrgUnitId())+"\t");
						out.print(empBen.getJobTime()+"\t");
						out.print(SHFTableUtils.getInnerJobName(empBen.getInnerJobId()) + "\t");
						out.print( ((empBen.getWorkFromHome() == 1)?" כן ":" לא ") + "\t");
						out.print( ((empBen.getTrained() == 1)?" לא ":" כן ") + "\t");
						out.print(empBen.getPhoneCellular() + "\t");
						out.print((GenericValidator.isBlankOrNull(empBen.getPhoneHome())?"":empBen.getPhoneHome()) + "\t");
						out.print(empBen.getCity() + "\t");
						out.print("\n"); 
						
					}
				}
				out.close();
			}
			else if (param.equals("search_potential_inforce_add_inf")) {
				new PotentialInforceForm();
				
				
				shiftInforce=(ShiftInforceRequestForm)form;
				//shiftInforce = new ShiftInforceRequestForm();
				shiftsModel=new ShiftDataModel(shiftInforce);
				
				shiftsModel.setAddInforceDefaults();
				request.setAttribute("shiftInforce",shiftInforce);
				result=mapping.findForward("success");
			}
			else if(param.equals("search_add_options")){
				shiftInforce=(ShiftInforceRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftInforce);
				Vector vec=shiftsModel.searchAddOptions();
				request.setAttribute("shiftInforce",shiftInforce);
				request.setAttribute("inforces",vec);
				result=mapping.findForward("success");
			}
			// deal with exceptions other then breaks(type=4), Igal 11.2014
			else if( param.equals("upsert_shift_check_exceptions") ) { 
				
				String del_exceps_confirmed = request.getParameter("del_exceps_confirmed");
				ShiftDataForm shiftsForm_confirmed = null;
				if (del_exceps_confirmed != null && del_exceps_confirmed.equals("true")) { // if user confirmed canceling exceptions
					shiftsForm_confirmed = (ShiftDataForm) session.getAttribute("exceps_shiftDataForm");
					session.removeAttribute("exceps_shiftDataForm");
					request.setAttribute("del_exceps_confirmed", "true");
					request.setAttribute("shiftDataForm", shiftsForm_confirmed);
					result=mapping.findForward("exception_confirmed"); // redirect to param=upsert_shift
					return result;
					
				} else {

					shiftsForm=(ShiftDataForm)form;
					ExceptionDataModel excepModel = new ExceptionDataModel();
					
					Vector<ExceptionBean> userExceptions = excepModel.populateUserExceptionsNoBreaks( shiftsForm.getAgentDayId() );
					
					if ( userExceptions != null && userExceptions.size() > 0 ) { // if exceptions found check if conflicting with new hours
						Vector<ExceptionBean> conflicting_exceps = new Vector<ExceptionBean>();
						Calendar calStart = Calendar.getInstance();
						calStart.setTime(shiftsForm.getNewStartDate());
						calStart.set(Calendar.HOUR_OF_DAY, Integer.parseInt((shiftsForm.getNewStartTime().split(":")[0])));
						calStart.set(Calendar.MINUTE, Integer.parseInt((shiftsForm.getNewStartTime().split(":")[1])));
						Date newStartTime = calStart.getTime();
						
						Calendar calEnd = Calendar.getInstance();
						calEnd.setTime(shiftsForm.getNewEndDate());
						calEnd.set(Calendar.HOUR_OF_DAY, Integer.parseInt((shiftsForm.getNewEndTime().split(":")[0])));
						calEnd.set(Calendar.MINUTE, Integer.parseInt((shiftsForm.getNewEndTime().split(":")[1])));
						Date newEndTime = calEnd.getTime();
						
						AppResources appRes = AppResources.getInstance();
						TablesContainer tc = appRes.getTablesContainer();
						Vector<ExceptionActivityBean> exceptionTypes = tc.getTable("exceptionCode");
						Vector<ExceptionActivityBean> splitExceptionTypes = new Vector<ExceptionActivityBean>();
						
						for (ExceptionActivityBean exception : exceptionTypes) {
							if (exception.isSplitShiftType()) {
								splitExceptionTypes.add(exception);
							}
						}
						
						for (ExceptionBean userException : userExceptions) {
							boolean isSplit = false;
							for (ExceptionActivityBean splitException : splitExceptionTypes) {		// do not check exceptions of type split shift
								if (userException.getExceptionType().equals(splitException.getCode())) {
									isSplit = true;
									break;
								}
							}
							if (! isSplit) {
								if ( ! ( 	(userException.getStartTime().after( newStartTime ) || userException.getStartTime().equals( newStartTime ) )
										&&	(userException.getEndTime().before( newEndTime ) || userException.getEndTime().equals( newEndTime ) )
										) ) {
									conflicting_exceps.add(userException);
								}
							}

						}
						
						if (conflicting_exceps.size() > 0 ) {
							session.setAttribute("conflicting_exceps",conflicting_exceps);
							request.setAttribute("conflicting_exceps",conflicting_exceps); // for JSP
							request.setAttribute("shiftForm",shiftsForm); // for JSP
							session.setAttribute("exceps_shiftDataForm", shiftsForm); // for next time, if user confirms exceps canceling
							result=mapping.findForward("success");
							return result;
						} else {	// no conflicting exceptions found, redirect to param=upsert_shift
							request.setAttribute("shiftDataForm",shiftsForm);
							result = mapping.findForward("fail"); 
							return result;
						}

					} else {	// no exceptions found, redirect to param=upsert_shift
						request.setAttribute("shiftDataForm",shiftsForm);
						result = mapping.findForward("fail"); 
						return result;
					}
				}
			}
			else if(param.equals("upsert_shift")) {
				
				shiftsForm = (ShiftDataForm)form;
				shiftsModel = new ShiftDataModel(shiftsForm);
				shiftsModel.setsCtx(getServlet().getServletContext());
				
				try{
					shiftsModel.validateUpdate();
				} catch(ShfException e){
					saveErrors(request,e.getErrors());
					result = mapping.findForward("fail");
					request.setAttribute("shiftForm",shiftsForm);
					return result;
				}
				
				try {
					shiftsModel.upsertShift();
				} catch (ShfException e) {
					saveErrors(request,e.getErrors());
					saveErrors(request,e.getErrors());
					result = mapping.findForward("fail");
					request.setAttribute("shiftForm",shiftsForm);
					return result;
				}
				
				// deal with exceptions other than breaks(type=4), Igal 11.2014
				// START
				String del_exceps_confirmed = (String) request.getAttribute("del_exceps_confirmed");
				if (del_exceps_confirmed != null && "true".equals(del_exceps_confirmed) ) {
					Vector<ExceptionBean> conflicting_exceps = (Vector<ExceptionBean>) session.getAttribute("conflicting_exceps");
					session.removeAttribute("conflicting_exceps");
					
					EmployeeExceptionForm excepForm = new EmployeeExceptionForm();
					excepForm.setUserFirstName(shiftsForm.getUserFirstName());
					excepForm.setUserLastName(shiftsForm.getUserLastName());
					String reason_code = ( "00".equals(shiftsForm.getNewStartStatusForUpdate()) ) ? shiftsForm.getNewEndStatusForUpdate(): shiftsForm.getNewStartStatusForUpdate() ;
					excepForm.setCancelReasonCode(reason_code);
					excepForm.setCancelRemark(SHFTableUtils.getEventReasonName(reason_code));
					excepForm.setAgentDayId(shiftsForm.getAgentDayId());
					if ( conflicting_exceps != null && conflicting_exceps.size() > 0 ) {
						for (ExceptionBean exceptionBean : conflicting_exceps) {
							excepForm.setStartTime(exceptionBean.getStartTime());
							excepForm.setStateType(exceptionBean.getStateType());
							ExceptionDataModel excepModel = new ExceptionDataModel(excepForm);
							excepModel.cancelException();
						}
					}
				}
				// END
				
				Vector breaks = BreakDataModel.populateBreaksForShift(shiftsForm.getAgentDayId());
				request.setAttribute("shiftBreaks",breaks);
				
				result = mapping.findForward("success");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.updateSecceeded",null));
				saveErrors(request,actionErrors);
				
			}  else if ("updateShiftLocation".equals(param)){
				shiftsForm = (ShiftDataForm)form;
				shiftsModel = new ShiftDataModel(shiftsForm);
				ActionErrors actionErrors = new ActionErrors();
				try {
					shiftsModel.updateShiftLocation();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.updateSecceeded"));
				} catch (ShfException e) {
					if (e.getErrors().get("shf") != null) {
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX, (ActionError)e.getErrors().get("shf").next());
					} else {
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed"));
					}
					
					
				}
				saveErrors(request,actionErrors);
				
				return mapping.findForward("success");
			} else if ("addFromFile".equals(param)){
				
				shiftsForm = (ShiftDataForm)form;
				String fileAttrName = "addShiftFromFileError";
				
				if("upload".equals(request.getParameter("mode"))){
					
					ShiftDataModel model = new ShiftDataModel(shiftsForm);
					String output = "";
					try {
						output = model.AddShiftsFromFile();
					} catch (ShfException e) {
						saveErrors(request,e.getErrors());
						return mapping.findForward("selectFile");
					}
					if (SHFUtils.isEmpty(output)) {	// all records processed successfully without any error
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.insertSecceeded"));
						saveErrors(request,actionErrors);

					} else {
						// if errors exist, save to session for later retrieve (download)
						session.setAttribute(fileAttrName, output);
						request.setAttribute(fileAttrName, "true");
					}

				} else if("download".equals(request.getParameter("mode"))){
					
					response.setHeader("Cache-Control","no-cache");
					response.setHeader("Pragma","no-cache");
					String nowStr = SHFUtils.formatDateToString(new Date(),"ddMMyyyyhhmmss");
					response.setHeader("Content-Disposition","atachment;filename=Errors_" + nowStr + ".csv");
					response.setContentType("text/csv");
					
					// if errors exist, output them to file
					String file = (String) session.getAttribute(fileAttrName);
					session.removeAttribute(fileAttrName);	// clear session
					if (SHFUtils.isEmpty(file)) {
						file = "An error occured while trying retrieve the file";
						response.setContentType("text/html");
					}

					logger.info("exporting shifts result to excel");
					
					PrintWriter out = response.getWriter();
					out.print(file);
//					out.close();
					return null;
				}
				
				return mapping.findForward("selectFile");
			}
			else if(param.equals("add_shift_request")){
				AddShiftRequestForm addShiftForm=(AddShiftRequestForm)form;
				shiftsModel=new ShiftDataModel(addShiftForm);
				try{
					shiftsModel.addShift();
					if (addShiftForm.getSourceWindow().equals("shift_inforce"))
						result=mapping.findForward("success_add");
						
					if (addShiftForm.getSourceWindow().equals("inforce_option"))
						result=mapping.findForward("success");
					
				}
				catch(ShfException e){
					shiftInforce=new ShiftInforceRequestForm();
					shiftInforce.setUserId(addShiftForm.getUserId());
					shiftInforce.setAllowedMoked(addShiftForm.getAllowedMoked());
					shiftsModel=new ShiftDataModel(shiftInforce);
					Vector vec=shiftsModel.searchAddOptions();
					request.setAttribute("shiftInforce",shiftInforce);
					request.setAttribute("inforces",vec);
					saveErrors(request,e.getErrors());
					if (addShiftForm.getSourceWindow().equals("shift_inforce"))
						result=mapping.findForward("fail_add");

					if (addShiftForm.getSourceWindow().equals("inforce_option"))
						result=mapping.findForward("fail");
				}
				
			}
			
			else if(param.equals("update_param")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				long shiftId;
				if(request.getParameter("shiftId")!=null)
					shiftId =  Long.parseLong(request.getParameter("shiftId"));
				else shiftId=shiftsForm.getAgentDayId();
				shiftsForm.setAgentDayId(shiftId);
				shiftsModel.populateShiftForUpdate();
				shiftsModel.setChangeShiftDefaults();
				Vector<BreakBean> breaks = BreakDataModel.populateBreaksForShift(shiftId);
				
				request.setAttribute("shiftBreaks",breaks);
				result=mapping.findForward("success");
			}
			
			else if(param.equals("shift_cancel_remark")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				shiftsForm=(ShiftDataForm)form;
				result=mapping.findForward("success");
			}
			
			else if(param.equals("addShiftTimeChangeParam")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				shiftsModel.setShiftChangeFormDefaults();
				request.setAttribute("shiftChangeForm",shiftChangeRequestForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("addUpdateChangeRequest")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				request.setAttribute("shiftChangeForm",shiftChangeRequestForm);
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				if(shiftChangeRequestForm.getMode().equals("insert"))
					shiftsModel.addShiftChangeRequest();
				else if(shiftChangeRequestForm.getMode().equals("update"))
					shiftsModel.updateShiftChangeRequest();
				else if(shiftChangeRequestForm.getMode().equals("delete"))
					shiftsModel.deleteShiftChangeRequest();
				result=mapping.findForward("success");
				result.setRedirect(true);
				
			}
			else if(param.equals("viewShiftTimeChangeRequests")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector change_requests=shiftsModel.populateShiftChangeRequests();
				if("export".equals(shiftChangeRequestForm.getMode())){
					response.setContentType("application/msexcel");
					response.setHeader("Content-Disposition","atachment;filename=reduce_repository_table.xls");
					PrintWriter out = response.getWriter();
					exportRepository(change_requests,out);
					return null;
				}
				request.setAttribute("change_requests",change_requests);
				result=mapping.findForward("success");
			}
			else if(param.equals("updateShiftTimeChangeParam")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector vec=shiftsModel.populateShiftChangeRequests();
				if(vec!=null && vec.size()>0){
					ShiftChangeRequestForm changeForm=(ShiftChangeRequestForm)vec.get(0);
					changeForm.setMode(shiftChangeRequestForm.getMode());
					request.setAttribute("shiftChangeForm",changeForm);
					result=mapping.findForward("success");
				}else{
					result=mapping.findForward("fail");
				}
				
			}
			else if(param.equals("requestOptions")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector vec=shiftsModel.populateShiftChangeRequests();
				shiftChangeRequestForm=(ShiftChangeRequestForm)vec.get(0);
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector options=shiftsModel.populateChangeRequestOptions();
				request.setAttribute("chageRequestOptions",options);
				session.setAttribute("chageRequestForm",shiftChangeRequestForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("requestApplications")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				if(shiftChangeRequestForm.getRequestId()==0)
					shiftChangeRequestForm=(ShiftChangeRequestForm)session.getAttribute("chageRequestForm");
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector vec=shiftsModel.populateShiftChangeRequests();
				shiftChangeRequestForm=(ShiftChangeRequestForm)vec.get(0);
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				shiftsModel.populateChangeRequestApplications();
				session.setAttribute("chageRequestForm",shiftChangeRequestForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("agentRequests")){
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)form;
				shiftChangeRequestForm.setRequestId(0);
				if(shiftChangeRequestForm.getAllowedMoked()==null){
					logger.error("allowed moked=null for user:"+shiftChangeRequestForm.getUserId());
					ActionErrors errors=new ActionErrors();
					errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.invalidAgent"));
					saveErrors(request,errors);
					return mapping.findForward("fail");
				}
				shiftChangeRequestForm.setMoked(shiftChangeRequestForm.getAllowedMoked());
				shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
				Vector vec=shiftsModel.populateShiftChangeRequests();
				Vector options=shiftsModel.populateChangeRequestOfAgent(shiftChangeRequestForm.getUserId(),vec);
				request.setAttribute("changeRequestOptions",options);
				result=mapping.findForward("success");
			}
			else if(param.equals("confirmChangeRegister")){
				ChangeRequestCandidate candidate=(ChangeRequestCandidate)form;
				if(session.getAttribute("chageRequestForm")==null) throw new ShfException(new ActionError("shf.error.general"));
				ShiftChangeRequestForm shiftChangeRequestForm=(ShiftChangeRequestForm)session.getAttribute("chageRequestForm");
				shiftChangeRequestForm.setAutoApprove(1);
				shiftChangeRequestForm.setUserId(candidate.getUserId());
				shiftChangeRequestForm.setUserFirstName(candidate.getUserFirstName());
				shiftChangeRequestForm.setUserLastName(candidate.getUserLastName());
				confirmChangeRequest(candidate,shiftChangeRequestForm);
				if(shiftChangeRequestForm.getAprovedNum()==shiftChangeRequestForm.getAgentsNum()){
					result=mapping.findForward("full");
				}else {
					result=mapping.findForward("success");
				} 
				request.setAttribute("chageRequestForm",shiftChangeRequestForm);
			}
			else if(param.equals("rejectChangeCandidate")){
				ChangeRequestCandidate changeCandidate=(ChangeRequestCandidate)form;
				ShiftChangeRequestForm changeRequestForm=new ShiftChangeRequestForm(changeCandidate.getRequestId());
				shiftsModel=new ShiftDataModel(changeRequestForm);
				shiftsModel.rejectCandidate(changeCandidate.getAgentDayId());
				AgentDayBean day=ShiftDataModel.populateShift(changeCandidate.getAgentDayId());
				shiftsModel.sendChangeRequestMessages(day,1);
				result=mapping.findForward("success");
				result.setRedirect(true);
			}
			else if(param.equals("registerToChangeRequest")){
				ChangeRequestCandidate changeCandidate=(ChangeRequestCandidate)form;
				ShiftChangeRequestForm changeRequestForm=new ShiftChangeRequestForm(changeCandidate.getRequestId());
				changeRequestForm.setMoked(changeCandidate.getAllowedMoked());
				shiftsModel=new ShiftDataModel(changeRequestForm);
				Vector vec=shiftsModel.populateShiftChangeRequests();
				if(vec==null || vec.size()==0){
					 return mapping.findForward("fail"); 
				}
				ShiftChangeRequestForm requestForm=(ShiftChangeRequestForm)vec.get(0);
				requestForm.setUserId(changeCandidate.getUserId());
				confirmChangeRequest((AgentDayBean)changeCandidate,requestForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("shiftChangeRejectAll")){
				ShiftChangeRequestForm changeRequestForm=(ShiftChangeRequestForm)form;
				shiftsModel=new ShiftDataModel(changeRequestForm);
				shiftsModel.rejectAllUnApproved();
				result=mapping.findForward("success");
			}
			else if(param.equals("deleteFromRepositories")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				shiftsModel.deleteFromRepositories();
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.deleteSecceeded"));
				saveErrors(request,actionErrors);
				result=mapping.findForward("success");
			}
			else if(param.equals("showRemarkDialog")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				shiftsForm=(ShiftDataForm)form;
				result=mapping.findForward("success");
			}
			else if(param.equals("addRemark")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				shiftsModel.saveRemark();
				result=mapping.findForward("success");
			}
			else if(param.equals("export")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				Vector shifts=shiftsModel.populateShiftList();
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				response.setHeader("Content-Disposition","atachment;filename=shifts_table_"+BaseConvert.dateToString(new Date(), "ddMMHHmm")+".xls");
				response.setContentType("application/msexcel");
				logger.info("exporting shifts to excell");
				
				PrintWriter out = response.getWriter();
				if(shifts!=null){
					AgentDayBean day=null;
					out.print("יום"+"\t");
					out.print("תאריך"+"\t");
					out.print("שם"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("תור"+"\t");
					out.print("צוות"+"\t");
					out.print("החלפה"+"\t");
					out.print("תגבור"+"\t");
					out.print("שינוי"+"\t");
					out.print("הערה"+"\n");
					
					
					for(int i=0;i<shifts.size();i++){
						day=(AgentDayBean)shifts.get(i);
						
						out.print(SHFUtils.getDayOfWeek(day.getShiftStart()));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy"));
						out.print("\t");
						out.print(day.getFullName());
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"HH:mm"));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftEnd(),"HH:mm"));
						out.print("\t");
						out.print(SHFTableUtils.getInnerJobName(day.getInnerJobId()));
						out.print("\t");
						out.print(SHFTableUtils.getActivityNamesExport(day.getShiftActivity()) );
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(day.getOrgUnitCode()));
						out.print("\t");
						out.print((day.getNewEmpIdNumber()!=null?"כן":"לא") );
						out.print("\t");
						out.print((day.getShiftSource().startsWith("f")?"כן":"לא") );
						out.print("\t");
						if(day.getNewShiftStart()!=null || day.getNewShiftEnd()!=null)
							out.print(SHFUtils.getLengthFormat(day.getShiftLengthChange()));
						else
							out.print("לא");
						out.print("\t");
						out.print((day.getRemark()==null?"":day.getRemark()) );
						out.print("\t");
						out.print("\n");
					}
				}
				out.close();
			}
			
			else if(param.equals("currentExport")){
				shiftsForm=(ShiftDataForm)form;
				shiftsModel=new ShiftDataModel(shiftsForm);
				Vector shifts=shiftsModel.getCurrentShifts();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=current_shifts_table.xls");
				logger.info("exporting current shifts to excell");
				
				PrintWriter out = response.getWriter();
				if(shifts!=null){
					AgentDayBean day=null;
					out.print("יום"+"\t");
					out.print("שם"+"\t");
					out.print("תאריך"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("תור"+"\t");
					out.print("צוות"+"\t");
					out.print("נוכחות"+"\n");
					
					
					for(int i=0;i<shifts.size();i++){
						day=(AgentDayBean)shifts.get(i);
						
						out.print(SHFUtils.getDayOfWeek(day.getShiftStart()));
						out.print("\t");
						out.print(day.getFullName());
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy"));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"HH:mm"));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftEnd(),"HH:mm"));
						out.print("\t");
						out.print(SHFTableUtils.getInnerJobName(day.getInnerJobId()) );
						out.print("\t");
						out.print(SHFTableUtils.getActivityNamesExport(day.getShiftActivity()) );
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(day.getOrgUnitCode()));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getStationArrivalTime(),"HH:mm"));
						out.print("\t");
						out.print("\n");
					}
				}
				out.close();
			}
			
			else if(param.equals("view_add_shift")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				AddShiftForm addShiftForm=(AddShiftForm)form;
				shiftsModel = new ShiftDataModel(addShiftForm);
				shiftsModel.setAddSingleShiftDefaults();
				result = mapping.findForward("success");
				request.setAttribute("addShiftForm", addShiftForm);
				return result;
			}
			
			else if(param.equals("add_extra_shift")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				AddShiftForm addShiftForm=(AddShiftForm)form;
				addShiftForm.setSourceActivity("add_extra_shift");
				shiftsModel = new ShiftDataModel(addShiftForm);
				String action = new String(param);  
				try{
					shiftsModel.setsCtx(getServlet().getServletContext());
					shiftsModel.addSingleShift(action);
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(null, new ActionError("shf.success.insertSecceeded"));
					saveErrors(request,actionErrors);
				}catch (ShfException e) {
					saveErrors(request, e.getErrors());
				}
				result=mapping.findForward("success");
				request.setAttribute("addShiftsForm", addShiftForm);
				EmployeeDataForm employeeDataForm=new EmployeeDataForm();
				employeeDataForm.setEmployeeId(addShiftForm.getEmployeeId());
				request.setAttribute("employeeDataForm", employeeDataForm);
				return result;
			}
			
			
			else if(param.equals("add_extra_shift_all")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				AddShiftForm addShiftForm=(AddShiftForm)form;
				addShiftForm.setSourceActivity("add_extra_shift_all");
				shiftsModel=new ShiftDataModel(addShiftForm);
				shiftsModel.setsCtx(getServlet().getServletContext());
				int sum = 0;
				if (addShiftForm.getIdNumberPotentialAll()!=null){
					 sum = addShiftForm.getIdNumberPotentialAll().length;
				}
				String allResult="ok";
				String action = new String(param);
				for (int i=0; i<sum; i++) {
					shiftsModel.prapreSingleShiftData(i);
					if(addShiftForm.getBreaksNumber() > 0 && addShiftForm.getBreakStart()[0].equals("00:00") && addShiftForm.getBreakEnd()[0].equals("00:00")){
						continue;
					}else{
						try{
							shiftsModel.addSingleShift(action);
							ActionErrors actionErrors=new ActionErrors();
							actionErrors.add(null, new ActionError("shf.success.insertSecceeded"));
							saveErrors(request,actionErrors);
							//response.getWriter().write("ok");
						
						}catch (ShfException e) {
							ActionErrors actionErrors = new ActionErrors();
							ActionError actionError=new ActionError(e.getMessage().replace('[', ' ').replace(']', ' ').trim());
							actionErrors.add(null, actionError);
							saveErrors(request, actionErrors);
							request.getSession().setAttribute(Action.ERROR_KEY, actionErrors);
							//response.getWriter().write("error is "+e.getMessage());
							allResult = e.getMessage();
							break;
						}
					}					
				}
				response.getWriter().write(allResult);
				addShiftForm.setSourceActivity("close");
				request.setAttribute("addShiftForm",addShiftForm);
				
//				request.setAttribute("addShiftsForm", addShiftForm);
//				EmployeeDataForm employeeDataForm=new EmployeeDataForm();
//				employeeDataForm.setEmployeeId(addShiftForm.getEmployeeId());
//				request.setAttribute("employeeDataForm", employeeDataForm);
				
				return result;
			}
			else if(param.equals("shift_cancel")){
				shiftsForm=(ShiftDataForm)form;
				request.getParameter("locParam");
				shiftsModel=new ShiftDataModel(shiftsForm);
				try{
					shiftsModel.checkShiftForCancel();	
				}catch (ShfException e){
					saveErrors(request, e.getErrors());
					if(request.getParameter("locParam") != null){
						return result = mapping.findForward("employeeCard");
					}else{
						return result = mapping.findForward("shiftsParam");
					}
				}
				try {
					shiftsModel.setsCtx(getServlet().getServletContext());
					shiftsModel.cancelShift();
				}catch (ShfException e) {
					saveErrors(request, e.getErrors());
				}
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.deleteSecceeded"));
				saveErrors(request, actionErrors);
				
				if(request.getParameter("locParam") != null){
					result = mapping.findForward("employeeCard");
				}else{
					result = mapping.findForward("shiftsParam");
				}
			}
			
			else if(param.equals("shift_cancel_login_view")){
				//Yuval
				ShiftLoginCancelForm shiftsLoginCancelForm=(ShiftLoginCancelForm)form;
				shiftsModel=new ShiftDataModel(shiftsLoginCancelForm);
				AgentDayBean shift=new AgentDayBean();
				shift  = shiftsModel.populateShift(shiftsLoginCancelForm.getAgentDayId());
				shiftsLoginCancelForm.setAgantFirstName(shift.getFirstName());
				shiftsLoginCancelForm.setAgantLastName(shift.getLastName());
				shiftsLoginCancelForm.setShiftStart(shift.getShiftStart());
				shiftsLoginCancelForm.setShiftEnd(shift.getShiftEnd());
				shiftsLoginCancelForm.setAgantOrgUnit(shift.getOrgUnitCode());
				
				shiftsLoginCancelForm.setApplierVec(shiftsModel.populateManagerLoginCancel(SHFConstants.LOGIN_CANCEL_APPLIER_JOBS));
				shiftsLoginCancelForm.setUpdaterVec(shiftsModel.populateManagerLoginCancel(SHFConstants.LOGIN_CANCEL_UPDATER_JOBS));
				
				shiftsLoginCancelForm.setMissingReasonId(shift.getMissingReasonId());
				shiftsLoginCancelForm.setEmployeeId(shift.getEmployeeId());
				
				request.setAttribute("shiftsLoginCancelForm",shiftsLoginCancelForm);
				result=mapping.findForward("success");
				return result;
			}
			else if(param.equals("shift_cancel_login_update")) {
				
				//Yuval
				ShiftLoginCancelForm shiftsLoginCancelForm=(ShiftLoginCancelForm)form;
				shiftsModel=new ShiftDataModel(shiftsLoginCancelForm);
//				new AgentDayBean();
				
				shiftsModel.addLoginCancelEvent(shiftsLoginCancelForm);
				prapareCancelLoginMail(shiftsLoginCancelForm);
				request.setAttribute("shiftsLoginCancelForm",shiftsLoginCancelForm);
				result=mapping.findForward("success");
				return result;
			}
			else if ("checkPoolExtensionAllocated".equals(param)) {
				shiftsForm = (ShiftDataForm)form;
				shiftsModel = new ShiftDataModel(shiftsForm);
				AgentDayBean agentDayBean = shiftsModel.populateShift(shiftsForm.getAgentDayId());
				if (agentDayBean.isWorkingFromHome()) {
					if (agentDayBean.getShiftExtNum() != null) {
						result=mapping.findForward("success");
						response.getWriter().write("success");
					} else {
						result=mapping.findForward("fail");
						response.getWriter().write("fail");
					}
				} else {
					throw new ShfException("Can not check pool extension, shift is not from home");
				}

				
//				return result;
			}
			else if ("poolExtAllocRelease".equals(param)) {
				shiftsForm = (ShiftDataForm)form;
				shiftsModel = new ShiftDataModel(shiftsForm);
				shiftsModel.setsCtx(getServlet().getServletContext());
				Vector<PoolExtAllocBean> poolExtAllocBeanVec = shiftsModel.poolExtAllocRelease();
				request.setAttribute("poolExtAllocBean", poolExtAllocBeanVec.get(0));
				request.setAttribute("shiftsForm", shiftsForm);
				
				result=mapping.findForward("success");
			}
				
		} catch (ShfException e) {
			saveErrors(request,e.getErrors());
			result=mapping.findForward("fail");
		} catch (ConvertException e) {
			e.printStackTrace();
		}
		request.setAttribute("shiftForm",shiftsForm);	
		return result;
	}



	private void prapareCancelLoginMail(ShiftLoginCancelForm shiftsLoginCancelForm) throws ShfException {
		String from = "shifter@Bezeq.co.il";
		
		String subject = "ביטול העברת משמרת ל-SAP";
		String body1 = "בוטלה העברת משמרת של הנציג : " + shiftsLoginCancelForm.getAgantFirstName() + " " + shiftsLoginCancelForm.getAgantLastName();
		String body2 = "מתאריך : " + shiftsLoginCancelForm.getShiftStartDate() + "    משעה: " + shiftsLoginCancelForm.getShiftStartTime();
		String body3 = "עד תאריך : " + shiftsLoginCancelForm.getShiftEndDate() + "    עד שעה: " + shiftsLoginCancelForm.getShiftEndTime();
		String body4 = "שם מאשר: " + shiftsLoginCancelForm.getApplierName();
		String body5 = "שם רושם: " + shiftsLoginCancelForm.getUpdaterName();
		String body6 = "הערה: " + shiftsLoginCancelForm.getCancelLoginRemark();
//		body6.replaceAll("(\r\n|\r|\n|\n\r)", "<br>");
		String managerMail = shiftsModel.getDirectManagerMail(shiftsLoginCancelForm.getEmployeeId());
		String to = managerMail;//"ruchamaVi@bezeq.co.il"; //"yuvalov@bezeq.co.il"
		String bodyStart = "<p dir=rtl>";
		String bodyEnd = "</p>";
		String bodyAll = null;
		bodyAll  = bodyStart + body1 + "<br>" + body2 + "<br>" + body3 + "<br>" + body4 + "<br>" + body5 + "<br>" + body6 + "<br>" + bodyEnd;
		if (managerMail != null) {
			SHFUtils.shfSendMail(from, to, subject, bodyAll);
		}
	}
	


	private void confirmChangeRequest(AgentDayBean agentDay,ShiftChangeRequestForm shiftChangeRequestForm) throws ShfException{
		if(shiftChangeRequestForm.getAprovedNum()>=shiftChangeRequestForm.getAgentsNum()){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.changeRequestFull"));
			throw new ShfException(actionErrors);
		}
		shiftsModel=new ShiftDataModel(shiftChangeRequestForm);
		agentDay.setOrgUnitCode(shiftChangeRequestForm.getMoked());
		shiftsModel.setAgentDayTimeByChangeRequest(agentDay);
		
		ChangeRequestCandidate candidate=new ChangeRequestCandidate();
		Date now=new Date();
		candidate.setAgentDayId(agentDay.getAgentDayId());
		candidate.setRequestId(shiftChangeRequestForm.getRequestId());
		if(shiftChangeRequestForm.getAutoApprove()==1){
			
			candidate.setApproveTime(now);
		
		}
		candidate.setModificationTime(now);
		candidate.setCreationTime(now);
		candidate.setModificationUser(agentDay.getUserFirstName()+" "+agentDay.getUserLastName());
		shiftsModel.updateCandidateToChangeRequest(candidate,agentDay);
		if(shiftChangeRequestForm.getAutoApprove()==1){
			AgentDayBean day=ShiftDataModel.populateShift(agentDay.getAgentDayId());
			shiftsModel.updateAgentDayTime(agentDay);
			shiftsModel.sendChangeRequestMessages(day,2);
			if(shiftChangeRequestForm.getAutoApprove()==1){
				shiftChangeRequestForm.setAprovedNum(shiftChangeRequestForm.getAprovedNum()+1);	
			}
			//fix breaks
			ShiftDataForm shiftDataForm=new ShiftDataForm();
			shiftDataForm.setAgentDayId(agentDay.getAgentDayId());
			shiftDataForm.setWmShiftStartTime(day.getShiftStart());
			shiftDataForm.setWmShiftEndTime(day.getShiftEnd());
			shiftDataForm.setNewStartDate(agentDay.getShiftStart());
			shiftDataForm.setNewStartTime(BaseConvert.dateToString(agentDay.getShiftStart(),"HH:mm"));
			shiftDataForm.setNewEndDate(agentDay.getShiftEnd());
			shiftDataForm.setNewEndTime(BaseConvert.dateToString(agentDay.getShiftEnd(),"HH:mm"));
			shiftsModel=new ShiftDataModel(shiftDataForm);
			shiftsModel.fixBreaks(null, null);
		}
		
		
	}
	
	private void exportRepository(Vector vector,PrintWriter out){
		
		if(vector!=null){
			ShiftChangeRequestForm request=null;
			out.print("תדריך"+"\t");
			out.print("שעת התחלה"+"\t");
			out.print("שעת סיום"+"\t");
			out.print("משך"+"\t");
			out.print("מוקד"+"\t");
			out.print("תור"+"\t");
			out.print("שינוי התחלת משמרת"+"\t");
			out.print("שינוי סוף משמרת"+"\t");
			out.print("מספר מקומות"+"\t");
			out.print("סוג אישור"+"\t");
			out.print("נוצר ע\"י"+"\t");
			out.print("תאריך יצירה"+"\n");
			try {
				for(int i=0;i<vector.size();i++){
					request=(ShiftChangeRequestForm)vector.get(i);
					out.print(BaseConvert.dateToString(request.getDate(),"dd/MM/yyyy") + "\t");
					out.print((request.getShiftStartOption()>0?request.getStartFrom()+" - "+request.getStartTo():"") + "\t");
					out.print((request.getShiftEndOption()>0?request.getEndFrom()+" - "+request.getEndTo():"") + "\t");
					out.print((request.getShiftLengthOption()>0?request.getShiftLength():"") + "\t");
					out.print(SHFTableUtils.getUnitName(request.getMoked()) + "\t");
					out.print(SHFTableUtils.getActivityName(request.getActivity())+ "\t");
					if(request.getChangeStartSelected()==1){	
						out.print(request.getStartChangeDesc()+" - "+  org.apache.struts.util.PropertyUtils.getProperty(request,request.getChangeStartOption()) + "\t");		
					}else{
						out.print("ללא שינוי" + "\t");
					}
					
					if(request.getChangeEndSelected()==1){
						out.print(request.getEndChangeDesc()+" - "+ org.apache.struts.util.PropertyUtils.getProperty(request,request.getChangeEndOption()) + "\t");
					}else{
						out.print("ללא שינוי" + "\t");
					}
	
					out.print(request.getAgentsNum() + "\t");
					out.print((request.getAutoApprove()==1?"אוטומטי":"ידני") + "\t");
					out.print(request.getCreatedBy() + "\t");
					out.print(BaseConvert.dateToString(request.getCreationTime(),"dd/MM/yyyy - HH:mm"));
					out.print("\n");
				}
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (InvocationTargetException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (NoSuchMethodException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		out.close();
	}
//
}
