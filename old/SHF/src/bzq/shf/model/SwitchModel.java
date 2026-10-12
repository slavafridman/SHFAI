/*
 * Created on 09/06/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Date;
import java.util.List;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionServlet;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EmployeeExceptionForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.forms.SwitchForm;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.CheckValidDate;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFSmsSender;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shfsp.request.SHFSPBreaks;
import bzq.shfsp.request.SHFSPBreaks.BreakInfo;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SwitchModel {
	private static Logger logger = Logger.getLogger(SwitchModel.class);
	protected AgentDayBean firstDay;
	protected AgentDayBean secondDay;
	protected SwitchForm form;
	

	public SwitchModel(AgentDayBean first,AgentDayBean second){
		this.firstDay=first;
		this.secondDay=second;
	}
	public SwitchModel(AgentDayBean first,AgentDayBean second, SwitchForm form){
		this.firstDay=first;
		this.secondDay=second;
		this.form = form;
	}
	
	public boolean validateReplace() throws ShfException{ // this method checks both shifts for switch
		logger.debug("Starting validateReplace()");
		boolean errors=false;
		ReplaceModel replaceModel=new ReplaceModel();
		form.setMessage("? קיימים אילוצים, האם להמשיך בהחלפה מאולצת");
		// TODO check if exception type is 3, if not no switch. currently deletes '3' only and switches anyway 
		
		// general checks
		if(firstDay.isSameTime(secondDay)){ // if shifts has same times - no switch
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchSameTime"));
			throw new ShfException(actionErrors);		
		}

		
//		if (firstDay.getInnerJobId() == null || secondDay.getInnerJobId() == null) {
//			ActionErrors actionErrors=new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchDifferentInnerJobs"));
//			throw new ShfException(actionErrors);
//		}
		
		if(firstDay.getInnerJobId() == null || secondDay.getInnerJobId() == null || !SHFTableUtils.isInnerJobsSwitchable(firstDay.getInnerJobId(),secondDay.getInnerJobId())){ // if NO inner job or NOT same
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchDifferentInnerJobs"));
			throw new ShfException(actionErrors);
		}
		
		CheckValidDate.checkSwitch(firstDay, secondDay); // check if new shift has min hours from next shift 1st agent
		
		CheckValidDate.checkSwitch(secondDay, firstDay); // check if new shift has min hours from next shift 2nd agent
		
		// -----------------START check 1st shift--------------------------
		
		if (firstDay.getStationArrivalTime()!=null ||	// No switch if shift: started by agent at station, ended by agent at station 
				firstDay.getStationExitTime()!=null || 		// agent is missing, agent late, started by stage
				firstDay.getMissingReasonId()>0 || 
				firstDay.getLateMinutes()>0 ||
				firstDay.getStageArrivalTime()!=null){
			
				ActionErrors actionErrors=new ActionErrors(); // throw an error for above
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchAttendance",firstDay.getFirstName()+" "+firstDay.getLastName()));
				throw new ShfException(actionErrors);
			}
			
			if(replaceModel.isExistInRepository(String.valueOf(firstDay.getAgentDayId()))){ // if first shift in repository
				return true;			}
			
			try{
				ShiftDataModel.checkIfSwitchBreakMade(firstDay.getAgentDayId()); // if first shift break is in repository
			}catch(ShfException e){
				return true;
			}
			
			if(ExceptionDataModel.isShiftContainsExceptionsNoSplit(firstDay.getAgentDayId())){ // if first shift has exceptions, split shift not counted as exception
				return true;			
			}
			
			if (firstDay.getShiftExtNum() != null) {
				form.setMessage(" למשמרת "+SHFUtils.formatDateToString(firstDay.getShiftStart(), "HH:mm")+" - "+SHFUtils.formatDateToString(firstDay.getShiftEnd(), "HH:mm")+" "+firstDay.getFullName()+", יש שלוחה מוקצית, האם ברצונך לבטל את השלוחה ולהמשיך בהחלפה ?");
				return true;
			}
		
		// -----------------END check 1st shift----------------------------
		
	
		// -----------------START check 2nd shift--------------------------
		
		
		if(secondDay.getStationArrivalTime()!=null ||   // No switch if shift: started by agent at station, ended by agent at station 
			secondDay.getStationExitTime()!=null || 	// agent is missing, agent late, started by stage
			secondDay.getMissingReasonId()>0 || 
			secondDay.getLateMinutes()>0 ||
			secondDay.getStageArrivalTime()!=null){
			
			ActionErrors actionErrors=new ActionErrors(); // throw an error for above
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchAttendance",secondDay.getFirstName()+" "+secondDay.getLastName()));
			throw new ShfException(actionErrors);		
		}
		
		if(replaceModel.isExistInRepository(String.valueOf(secondDay.getAgentDayId()))){ // if second shift in repository
			return true;
			}
		
		try{
			ShiftDataModel.checkIfSwitchBreakMade(secondDay.getAgentDayId()); // if second shift break is in repository
		}catch(ShfException e){
			return true;
		}
		
		if(ExceptionDataModel.isShiftContainsExceptionsNoSplit(secondDay.getAgentDayId())){ // if second shift has exceptions, split shift not counted as exception
			return true;
		}
		
		if (secondDay.getShiftExtNum() != null) {
			if (firstDay.getShiftExtNum() != null ) {
				form.setMessage("לשתי המשמרות יש שלוחות שהוקצו, האם לבטל אותן ולבצע החלפה?");
			} else {
				form.setMessage(" למשמרת "+SHFUtils.formatDateToString(secondDay.getShiftStart(), "HH:mm")+" - "+SHFUtils.formatDateToString(secondDay.getShiftEnd(), "HH:mm")+" "+secondDay.getFullName()+", יש שלוחה מוקצית, האם ברצונך לבטל את השלוחה ולהמשיך בהחלפה ?");
			}
			
			return true;
		}
		// ----------------- END check 2nd shift--------------------------
		
		/*
		if(!firstDay.getSiteId().equals(secondDay.getSiteId())){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchDifferentSite"));
			throw new ShfException(actionErrors);		
		}*/
		
		
		/*
		String act1=firstDay.getShiftActivity();
		String act2=secondDay.getShiftActivity();
		act1=act1.replace(';',' ').trim();
		act2=act2.replace(';',' ').trim();
		
		if(!act1.equals(act2)){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchDifferentInnerJobs"));
			throw new ShfException(actionErrors);		
		}*/
		return errors;
		
	}
	public void removeLimit( AgentDayBean agentA, AgentDayBean agentB, UserProfile userProfile ) throws ShfException{ // Igal 5.2013
		logger.debug("Starting removeLimit()");
		ReplaceModel replaceModel=new ReplaceModel();
		
		// first shift		
		if(replaceModel.isExistInRepository(String.valueOf(firstDay.getAgentDayId()))){ // check if 1st shift in repository
																						// removing shift will also delete breaks in repo.
			ShiftDataForm sdForm = new ShiftDataForm();
			sdForm.setAgentDayId(firstDay.getAgentDayId());
			sdForm.setEmployeeId(firstDay.getEmployeeId());
			sdForm.setWmSiteId(firstDay.getWmSiteId());
			sdForm.setNewSiteId(firstDay.getNewSiteId());
			
			ShiftDataModel sdModel = new ShiftDataModel(sdForm);
			sdModel.deleteFromRepositories();
			
		}else { // if shift is not in repo. , check breaks and delete if exists any
			try{
				ShiftDataModel.checkIfSwitchBreakMade(firstDay.getAgentDayId()); // if first shift break is in repository
			}catch(ShfException e){
				BreakDataModel breakDaModel = new BreakDataModel();
				breakDaModel.deleteAllBreaksFromCandidate(firstDay.getAgentDayId());
				
			}
		}
		// second shift
		if(replaceModel.isExistInRepository(String.valueOf(secondDay.getAgentDayId()))){ // check if 2nd shift in repository
			ShiftDataForm sdForm = new ShiftDataForm();
			sdForm.setAgentDayId(secondDay.getAgentDayId());
			sdForm.setActivity(new String[] { secondDay.getShiftActivity() });
			sdForm.setEmployeeId(secondDay.getEmployeeId());
			sdForm.setWmSiteId(secondDay.getWmSiteId());
			sdForm.setNewSiteId(secondDay.getNewSiteId());
			
			ShiftDataModel sdModel = new ShiftDataModel(sdForm);
			sdModel.deleteFromRepositories();
		} else{ // if shift is not in repo. , check breaks and delete if exists any
			try{
				ShiftDataModel.checkIfSwitchBreakMade(secondDay.getAgentDayId()); // if second shift break is in repository
			}catch(ShfException e){
				BreakDataModel breakDaModel = new BreakDataModel();
				breakDaModel.deleteAllBreaksFromCandidate(secondDay.getAgentDayId());
			}
		}
		
		// EXCEPTIONS
		EmployeeExceptionForm exceptionForm = new EmployeeExceptionForm();
		if(ExceptionDataModel.isShiftContainsExceptions(firstDay.getAgentDayId())){
			
			exceptionForm.setAgentDayId(firstDay.getAgentDayId());
			exceptionForm.setUserFirstName(userProfile.getFirstName());
			exceptionForm.setUserLastName(userProfile.getLastName());
			
			ExceptionDataModel edModel = new ExceptionDataModel(exceptionForm);
			edModel.cancelExceptionForcedSwitch();
		}
		if(ExceptionDataModel.isShiftContainsExceptions(secondDay.getAgentDayId())){
			exceptionForm.setAgentDayId(secondDay.getAgentDayId());
			exceptionForm.setUserFirstName(userProfile.getFirstName());
			exceptionForm.setUserLastName(userProfile.getLastName());
			
			ExceptionDataModel edModel = new ExceptionDataModel(exceptionForm);
			edModel.cancelExceptionForcedSwitch();
		}
		
		// pool extension release
		
		ShiftDataModel shiftDataModel = new ShiftDataModel();
		Vector<AgentDayBean> agentDayBeans = new Vector<AgentDayBean>();
		DBAccess db = null;
		
		if (firstDay.getShiftExtNum() != null) {
			firstDay.setPoolRequestType(2);
			agentDayBeans.add(firstDay);
		}
		
		if (secondDay.getShiftExtNum() != null) {
			secondDay.setPoolRequestType(2);
			agentDayBeans.add(secondDay);
		}
		
		if (agentDayBeans.size() > 0) {
			
			try {
				db = new DBAccess();
				shiftDataModel.processPoolPopulation(agentDayBeans, db);
			} catch (Exception e) {
				logger.error(e);
			} finally{
				try {
					db.close();
				} catch (DBException e) {
					throw new ShfException("db.close()", e);
				}
			}
		}
		
	} // END removeLimit

	public void replaceDays(ServletContext sCtx ) throws ShfException{
		logger.debug("Starting replaceDays()");

		String firstEmpIdNumber = firstDay.getEmpIdNumber();
		String secondEmpIdNumber = secondDay.getEmpIdNumber();
		Date now = new Date();
		
		firstDay.setNewEmpIdNumber(secondEmpIdNumber);
		secondDay.setNewEmpIdNumber(firstEmpIdNumber);
		firstDay.setSwitchDayId(secondDay.getAgentDayId());
		secondDay.setSwitchDayId(firstDay.getAgentDayId());
		firstDay.setModificationTime(now);
		secondDay.setModificationTime(now);
	
		DBAccess db = null;
		try{
			db = new DBAccess(false);
			// UPSERT SHIFTER.SHF_DAY_CHANGES
			updateEmpIdNumber(db,firstDay, secondDay);
			updateEmpIdNumber(db,secondDay, firstDay);
			
			// at this point switch is made, if there are breaks to send to softphone then try to send, if no success then revert changes else commit
			
//			Igal Managed breaks (after switch shift, send new breaks to SoftPhone, if failed abort switch)
//			try {
//				db.commit();
//				logger.info("forced switch made successfully between "+firstDay.getFirstName()+" "+firstDay.getLastName()+" and "+secondDay.getFirstName()+" "+secondDay.getLastName() + "  "+firstDay.getShiftStart()+" : "+secondDay.getShiftStart());
//			} catch (DBException e1) {
//				logger.error("error in replaceDays() while commit : "+e1.getMessage());
//				ActionErrors actionErrors=new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
//				throw new ShfException(actionErrors);
//			}
		}catch(ShfException e){
			try {
				db.rollback();
				logger.error(e);
			} catch (DBException e1) {
				logger.error("error in replaceDays() while rollback : "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			try {
				db.close();
			} catch (DBException e1) {
				logger.error("error in replaceDays() while closing db : "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			
			throw e;	// abort switch
		}
		
		boolean AcceptIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(firstDay.getOrgUnitCode())).getValue());
		boolean OfferIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(secondDay.getOrgUnitCode())).getValue());
		boolean isManagedBreaks = AcceptIsManagedBreaks || OfferIsManagedBreaks;
		boolean switchSuccess = false;
		
		if (isManagedBreaks) {
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(firstDay.getUserId());
			
			// Get breaks for both agents in order to switch between them at SoftPhone side
			Vector<BreakBean> acceptBreaks = null;
			Vector<BreakBean> offerBreaks = null;

			acceptBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(firstDay.getAgentDayId()));
			offerBreaks = BreakDataModel.populateBreaksForShift(Long.valueOf(secondDay.getAgentDayId()));
			
			if ( AcceptIsManagedBreaks && (acceptBreaks != null && acceptBreaks.size() > 0)) {		// delete current breaks (and later insert offer's breaks if exist)
				
				for(BreakBean breakBean : acceptBreaks){
					BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
					breakInfoIns.setMode("D");
					breakInfoIns.setEmployeeId(firstDay.getEmployeeIdNumberFull());
					breakInfoIns.setAgentDayId(Long.valueOf(firstDay.getAgentDayId()));
					breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
					breakInfoIns.setDuration(breakBean.getDuration());
					
					breakInfoList.add(breakInfoIns);
				}
				
				if ( offerBreaks != null && offerBreaks.size() > 0) {	// insert offer's breaks instead (switch)
					
					for(BreakBean breakBean : offerBreaks){
						BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
						breakInfoIns.setMode("I");
						breakInfoIns.setEmployeeId(firstDay.getEmployeeIdNumberFull());
						breakInfoIns.setAgentDayId(Long.valueOf(firstDay.getSwitchDayId()));
						breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
						breakInfoIns.setDuration(breakBean.getDuration());
						
						breakInfoList.add(breakInfoIns);
					}
				}
			}
			
			if ( OfferIsManagedBreaks && (offerBreaks != null && offerBreaks.size() > 0)) {
				
				for(BreakBean breakBean : offerBreaks){	// delete offer's breaks
					BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
					breakInfoIns.setMode("D");
					breakInfoIns.setEmployeeId(secondDay.getEmployeeIdNumberFull());
					breakInfoIns.setAgentDayId(Long.valueOf(secondDay.getAgentDayId()));
					breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
					breakInfoIns.setDuration(breakBean.getDuration());
					
					breakInfoList.add(breakInfoIns);
				}
				
				if ( acceptBreaks != null && acceptBreaks.size() > 0) {

					for(BreakBean breakBean : acceptBreaks) {	// insert accept's breaks instead (switch)
						BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
						breakInfoIns.setMode("I");
						breakInfoIns.setEmployeeId(secondDay.getEmployeeIdNumberFull());
						breakInfoIns.setAgentDayId(Long.valueOf(secondDay.getSwitchDayId()));
						breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
						breakInfoIns.setDuration(breakBean.getDuration());
						
						breakInfoList.add(breakInfoIns);
					}
				}
			}
			
			if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
				
				// convert to xml string (initial)
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				BreakDataModel breakModel = new BreakDataModel();
				
				// insert to transactions table and get transaction ID
				TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_SWITCH_SHIFT, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, firstDay.getUserId(), xmlStringMsg);
				
				breakModel.createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				// convert to xml string (final)
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// send Tibco message
				if (xmlStringMsg != null && transBean.getId() != 0) {
					try {
						logger.info("Attempting to send message to tibco queue ...");
						breakModel.sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (NamingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (JMSException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					
					//check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					logger.info("Checking response for transactiod id : " + transBean.getId());
					
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;					
					
					try {
						response = breakModel.checkMessageResponse(tmpVec);
						
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							logger.info("Response message found in DB");
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								switchSuccess = true;
								logger.info("Message contains SUCCESS status !");
							}
						}
						
					} catch (Exception e) {
						logger.error(e);
					}
					if (! switchSuccess) {
						
						// Failed to update SoftPhone, revert changes
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							db.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("Error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);
						
					} else {
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
				}
			} else {
				switchSuccess = true;	// if managed but no breaks to send to softphone
			}
		} else	{ // END IF isManagedBreaks
			switchSuccess = true;	// if breaks are not managed, then no need to send to softphone
		}
		
		// send SMS notification		
		if (switchSuccess) {
			EmployeeDataForm firstDayEmpDataForm = new EmployeeDataForm();
			firstDayEmpDataForm.setIdNumber(firstDay.getEmployeeIdNumberFull());
			EmployeeDataModel empModelFirst = new EmployeeDataModel(firstDayEmpDataForm);
			empModelFirst.populateByEmpIdNum();
			
			EmployeeDataForm secondDayEmpDataForm = new EmployeeDataForm();
			secondDayEmpDataForm.setIdNumber(secondDay.getEmployeeIdNumberFull());
			EmployeeDataModel empModelSecond = new EmployeeDataModel(secondDayEmpDataForm);
			empModelSecond.populateByEmpIdNum();
			
			SHFSmsSender smsSender = null;
			
			if ("1".equals(firstDayEmpDataForm.getReceiveSwitchSMS()) && !SHFUtils.isEmpty(firstDayEmpDataForm.getPhoneCellular())) {
				Vector<String> VecTo = new Vector<String>();
				VecTo.add(firstDayEmpDataForm.getPhoneCellular());
				
				String msg = SHFConstants.SMS_FORCED_SWITCH_MSG_PARAM;
				msg = msg.replace("{@1}", firstDayEmpDataForm.getFname());
				msg = msg.replace("{@2}", secondDay.getFullName());
				msg = msg.replace("{@3}", SHFUtils.formatDateToString(firstDay.getShiftStart(), "dd/MM"));
				
				smsSender = new SHFSmsSender(VecTo, msg, sCtx);
				try {
					smsSender.sendSHFSmsQueueMessage();
				} catch (Exception e) {
					logger.error(e);					
				}				
			}
			if ("1".equals(secondDayEmpDataForm.getReceiveSwitchSMS()) && !SHFUtils.isEmpty(secondDayEmpDataForm.getPhoneCellular())) {
				Vector<String> VecTo = new Vector<String>();
				VecTo.add(secondDayEmpDataForm.getPhoneCellular());	
				
				String msg = SHFConstants.SMS_FORCED_SWITCH_MSG_PARAM;
				msg = msg.replace("{@1}", secondDayEmpDataForm.getFname());
				msg = msg.replace("{@2}", firstDay.getFullName());
				msg = msg.replace("{@3}", SHFUtils.formatDateToString(secondDay.getShiftStart(), "dd/MM"));
				
				smsSender = new SHFSmsSender(VecTo, msg, sCtx);
				try {
					smsSender.sendSHFSmsQueueMessage();
				} catch (Exception e) {
					logger.error(e);					
				}	
			}			
		}
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	private void updateEmpIdNumber(DBAccess db, AgentDayBean day, AgentDayBean withDay) throws ShfException{
		//TODO - HASAVA - updateEmpIdNumber - D
		//forced switch
		logger.debug("Starting updateEmpIdNumber() dayId = " + day);
		int param_ind =1;
		StringBuffer sql = new StringBuffer();
		
		
		//HASAVA - start
//		AgentDayBean agentDay = ShiftDataModel.populateShift(day.getAgentDayId());
//		AgentDayBean withAgentDay = ShiftDataModel.populateShift(withDay.getAgentDayId());
		//HASAVA - end
		
		sql.append("UPDATE SHIFTER.SHF_DAY_CHANGES c SET c.new_employee_id = ?, c.SWITCH_DAY_ID = ?, c.NEW_SITE_ID = ?, c.MODIFICATION_TIME = ?");	// 1, 2, 3, 4
		sql.append("where c.shf_employee_day_id = ? ");		// 5
		
		try{
			db.prepareStatement(sql.toString());
			
			db.setString(param_ind++,day.getEmpIdNumber());		// 1
			db.setLong(param_ind++,day.getSwitchDayId());		// 2
			db.setString(param_ind++, withDay.getSiteId());		// 3
			db.setTimestamp(param_ind++, new Date());			// 4
			db.setLong(param_ind++,day.getAgentDayId());		// 5
			
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			sql = new StringBuffer();
			param_ind = 1;
			sql.append("INSERT INTO SHIFTER.SHF_DAY_CHANGES c");
			sql.append(" (c.shf_employee_day_id, ");// 1
			sql.append("c.new_employee_id, ");		// 2
			sql.append("c.SWITCH_DAY_ID,");			// 3
			//HASAVA - start
			sql.append("c.MODIFICATION_TIME, ");	// 4
			sql.append("c.NEW_ACTIVITY ,");			// 5
			sql.append("c.NEW_DAY_TYPE ,");			// 6
			sql.append("c.NEW_EXCEPTION_TYPE_ID ,");// 7
			sql.append("c.NEW_PAID_MINUTES ,");		// 8
			sql.append("c.NEW_SITE_ID ,");			// 9
			sql.append("c.NEW_TIMEOFF_TYPE_ID ,");	// 10
			sql.append("c.NEW_WORK_MINUTES, ");		// 11
			sql.append("c.NEW_DAY_START, ");		// 12
			sql.append("c.NEW_SHIFT_START, ");		// 13
			sql.append("c.NEW_DAY_END, ");			// 14
			sql.append("c.NEW_SHIFT_END, ");		// 15
			sql.append("c.NEW_WORK_FROM_HOME, ");	// 16
			sql.append("c.NEW_SPLIT_SHIFT ");		// 17
			
			if (day.isShiftSplit()) {
				sql.append(", c.NEW_SPLIT_START, c.NEW_SPLIT_END ");	// 18, 19
			}
			
			//HASAVA - end
			sql.append(" ) values ( ");
			sql.append("?,?,?, ");	// 1 - 3
			//HASAVA - start
			sql.append(" ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ");		// 4 - 17
			//HASAVA - end
			if (day.isShiftSplit()) {
				sql.append(", ?, ? ");		// 18, 19
			}
			sql.append(") ");
			
			try {
				db.prepareStatement(sql.toString());
				db.setLong(param_ind++,day.getAgentDayId()); //1
				db.setString(param_ind++,day.getEmpIdNumber()); //2
				db.setLong(param_ind++,day.getSwitchDayId()); //3
				//HASAVA - start
				db.setTimestamp(param_ind++, new Date()); //4
				db.setString(param_ind++, day.getShiftActivity()); //5
				db.setInt(param_ind++, day.getDayType()); //6
				db.setInt(param_ind++, day.getWmExceptionId()); //7
				db.setInt(param_ind++, day.getPaidMinutes()); //8
				db.setString(param_ind++, withDay.getSiteId()); //9
				db.setInt(param_ind++, day.getTimeoffTypeId()); //10
				db.setInt(param_ind++, day.getWorkMinutes()); //11
				db.setTimestamp(param_ind++, day.getDayStart()); //12
				db.setTimestamp(param_ind++, day.getShiftStart()); //13
				db.setTimestamp(param_ind++, day.getDayEnd()); //14
				db.setTimestamp(param_ind++, day.getShiftEnd()); //15
				db.setString(param_ind++, withDay.isWorkingFromHome() ? "Y" : "N"); //16
				db.setString(param_ind++, day.isShiftSplit() ? "Y" : "N"); //17
				//HASAVA - end
				if (day.isShiftSplit()) {
					db.setTimestamp(param_ind++, day.getSplitShiftStart()); //18
					db.setTimestamp(param_ind++, day.getSplitShiftEnd()); //19
				}
				
				db.executeUpdate();
			} catch (DBException e1) {
				logger.error("error in updateEmpIdNumber("+day.getAgentDayId()+") : "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			
		}catch(DBException e){
			logger.error("error in updateEmpIdNumber("+day.getAgentDayId()+") : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
	}

	/**
	 * @param l
	 */
	public void checkFirst() throws ShfException{ // check the first shift for switch
		logger.debug("Starting checkFirst()");
		if (firstDay.getStationArrivalTime()!=null ||	// No switch if shift: started by agent at station, ended by agent at station 
			firstDay.getStationExitTime()!=null || 		// agent is missing, agent late, started by stage
			firstDay.getMissingReasonId()>0 || 
			firstDay.getLateMinutes()>0 ||
			firstDay.getStageArrivalTime()!=null){
		
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchAttendance",firstDay.getFirstName()+" "+firstDay.getLastName()));
			throw new ShfException(actionErrors);
		}
		
		ReplaceModel replaceModel=new ReplaceModel();
		
		if(replaceModel.isExistInRepository(String.valueOf(firstDay.getAgentDayId()))){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchInCandidate",firstDay.getFirstName()+" "+firstDay.getLastName()));
			throw new ShfException(actionErrors);
		}
		
		try{
			ShiftDataModel.checkIfSwitchBreakMade(firstDay.getAgentDayId());
		}catch(ShfException e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchBreakInCandidate",firstDay.getFirstName()+" "+firstDay.getLastName()));
			throw new ShfException(actionErrors);
		}
		
		if(ExceptionDataModel.isShiftContainsExceptions(firstDay.getAgentDayId())){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchShiftHasExceptions"));
			throw new ShfException(actionErrors);
		}
	}

}
