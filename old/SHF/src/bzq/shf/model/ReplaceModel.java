/*
 * Created on 22/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakCandidateBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.ExceptionSearchBean;
import bzq.shf.bean.ShfBaseBean;
import bzq.shf.dao.FactoryDao;
import bzq.shf.dao.ReplaceByCritrionDao;
import bzq.shf.dao.SimpleFactoryDao;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.transfer.OfferReplaceByCritrion;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.transfer.ReplaceCandidates;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFSmsSender;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceModel {

	private static Logger logger = Logger.getLogger(ReplaceModel.class);
	
	private ServletContext sCtx;
	private ReplaceByCritrion replaceByCritrionForm;
	
	public final static int OFFER_REPLACE = 1;
	public final static int CANCEL_MY_OFFER = 2;
	public final static int REJECT_BECAUSE_CANCEL_REPLACE = 3;
	public final static int REJECT_REPLACE_OFFER = 4;	
	public final static int ACCEPT_REPLACE_OFFER = 5;
	public final static int HOURS_BEFORE_SHIFTS_BEGIN = 10;
	
	public ReplaceModel (){
	}
	
	public ReplaceModel (ReplaceByCritrion form){
		this.replaceByCritrionForm = form;
	}
	
	public Vector SearchCandidateForReplacement(ReplaceByCritrion replaceByCritrion) throws ShfException 	{
//		System.out.println("in replaceModel SearchCandidateForReplacement");
//		SimpleDateFormat ft = new SimpleDateFormat ("HH:mm:ss:SS");
//		System.out.println("SearchCandidateForReplacement() time : "+ft.format(new Date()));
		logger.debug("Starting SearchCandidateForReplacement()");
		
		Vector employeeWeekShifts = null;
		Vector candidateForReplacement = null;
		Vector candidateSuitable = null;
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			employeeWeekShifts = simpleFactoryDao.selectMyWeekShifts(replaceByCritrion);
			candidateForReplacement = simpleFactoryDao.selectAppropriateReplaceCandidate(replaceByCritrion);
			if(candidateForReplacement==null){
//				System.out.println("no candidate for replace for shift");
				throw new ShfException("no candidate for replace for shift "+replaceByCritrion.getShiftId());				
			}
			String minHoursBetweenShifts = SHFParameters.getMinHoursBetweenShifts(replaceByCritrion.getAllowedMoked()).getValue();
			long minHoursBetweenShiftsNum = SHFUtils.parseLong(minHoursBetweenShifts,SimpleFactoryDao.DEFUALT_EMPLOYEE_MIN_TIME_BETWEEN_TWO_SHIFTS)*SimpleFactoryDao.HOUR_IN_MILLI;
//			candidateSuitable = findSuitableCandidates(employeeWeekShifts,candidateForReplacement,minHoursBetweenShiftsNum); // multiple offers enabled, old code
			
			// since multiple offers enabled, remove shifts that already offered by this shift (i.e. not to display shift that i already offered to replace)
			Vector tmp = findSuitableCandidates(employeeWeekShifts,candidateForReplacement,minHoursBetweenShiftsNum);
			Vector<ReplaceCandidates> myOffersInRepository = null;
			Vector<Integer> shiftsIds = null;
			if ( tmp != null && tmp.size() > 0 ) {
				candidateSuitable = new Vector();
				shiftsIds = new Vector<Integer>();
				shiftsIds.add( Integer.valueOf( replaceByCritrion.getShiftId() ) );
				myOffersInRepository = simpleFactoryDao.getFromReplaceCandidatesByShiftId(shiftsIds);
				if ( myOffersInRepository != null ) {	// remove only if already offered ( not applied to first check, ie if not yet in repository )
					for ( int i=0; i<tmp.size(); i++ ) {
						boolean alreadyOffered = false;
						for ( int j=0; j<myOffersInRepository.size(); j++ ) {
							if ( ((ReplaceByCritrion)tmp.get(i)).getShiftId().equals( String.valueOf( myOffersInRepository.get(j).getOffer() ) )  ) {	// if this shift already offered to this candidate
								alreadyOffered = true;
								break;
							}
						}
						if ( ! alreadyOffered ) {
							candidateSuitable.add(tmp.get(i));
						}
					}
				} else {
					candidateSuitable = tmp;
				}
			}
				 
		} catch (ShfException e) {
			
		}
//		SimpleDateFormat ft1 = new SimpleDateFormat ("HH:mm:ss:SS");
//		System.out.println("SearchCandidateForReplacement() --- END --- time : "+ft1.format(new Date()));
		return candidateSuitable;
	}
	

	public Vector getShiftsInReplaceRepository(String userId,String allowMoked,String allowedAgaf)	{
		logger.debug("Starting getShiftsInReplaceRepository()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		Vector shiftsInReplaceRepositor = null;
		try {			
			shiftsInReplaceRepositor = simpleFactoryDao.selectShiftsInReplaceRepository(userId,allowMoked,allowedAgaf);		 
		} catch (ShfException e) {
			e.printStackTrace();
		}
		return shiftsInReplaceRepositor;
	}

	public void offerReplaceToCandidate(ReplaceByCritrion myShiftId, ReplaceByCritrion offerToShift, SHFSmsSender smsSender) throws ShfException	{
		logger.debug("Starting offerReplaceToCandidate()");
		EmployeeDataForm offerEmpForm = null;
		try {
			AgentDayBean myDay=ShiftDataModel.populateShift(Long.valueOf(myShiftId.getShiftId()).longValue());
			myShiftId.setFullname(myDay.getFirstName()+" "+myDay.getLastName());
			
//			AgentDayBean offerDay=ShiftDataModel.populateShift(Long.valueOf(offerToShift.getShiftId()).longValue());
//			offerToShift.setEmployeeOrgUnit(offerDay.getOrgUnitCode());
			
			offerEmpForm = new EmployeeDataForm();
			offerEmpForm.setEmployeeId(Integer.parseInt(offerToShift.getEmployeeId()));
			EmployeeDataModel empModel = new EmployeeDataModel(offerEmpForm);
			empModel.populate();
//			offerToShift.setEmployeeOrgUnit(offerEmpForm.getOrgUnitId());
		} catch (Exception e) {}
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			if (!simpleFactoryDao.updateOfferShift(myShiftId.getShiftId(),offerToShift.getShiftId()))	throw new ShfException("shift "+myShiftId.getShiftId()+" fail offer replace to shift "+offerToShift.getShiftId());
						
			ReplaceMassage replaceMassage;
			replaceMassage = new ReplaceMassage();
			replaceMassage.setEmpId(Integer.parseInt(offerToShift.getEmployeeId()));
			replaceMassage.setSubject("הצעה להחלפה");
			replaceMassage.setText(buildMassage(myShiftId,offerToShift,OFFER_REPLACE));
			replaceMassage.setNote("");
			replaceMassage.setMsgType(FactoryDao.MSG_TYPE_OFFER_REPLACE);
			replaceMassage.setShiftId(Integer.parseInt(offerToShift.getShiftId()));
			replaceMassage.setShiftStart(offerToShift.getStartTime());
			replaceMassage.setShiftEnd(offerToShift.getEndTime());
			replaceMassage.setOfferShiftId(Integer.parseInt(myShiftId.getShiftId()));
			replaceMassage.setOfferShiftStart(myShiftId.getStartTime());
			replaceMassage.setOfferShiftEnd(myShiftId.getEndTime());
			replaceMassage.setOfferEmployeeId(Integer.parseInt(myShiftId.getEmployeeId())); // TODO is null
			replaceMassage.setOfferFullName(myShiftId.getFullname());
			
			FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE); 
			
			factoryDao.insert(replaceMassage);
			
			// send SMS message
			boolean agafAllowedSMS = false;
			try {
				agafAllowedSMS = "1".equals(SHFParameters.getAgafSendSwitchOfferSMS(SHFTableUtils.getAgafCodeOf(offerEmpForm.getOrgUnitId())).getValue());
			} catch (Exception e) {
				logger.error("Error in offerReplaceToCandidate() while retrieving parameter 'AgafSendSwitchOfferSMS', error : "+e.getMessage());
			}
			
			if (agafAllowedSMS) {
				if("1".equals(offerEmpForm.getReceiveSwitchSMS())) {
					if (offerEmpForm.getPhoneCellular() != null && offerEmpForm.getPhoneCellular() != "" ) {
						String msg = SHFConstants.SMS_SWITCH_MSG_PARAM.replace("{@}", SHFUtils.formatDateToString(offerToShift.getStartTime(), "dd/MM"));
						Vector<String> tmp = new Vector<String>();
						tmp.add(offerEmpForm.getPhoneCellular());
						smsSender.setVecTo(tmp);
						smsSender.setMessage(msg);
						
						try {
							smsSender.sendSHFSmsQueueMessage();
						} catch (ShfException e) {
							logger.error("Error in offerReplaceToCandidate() while sending SMS : " + e.getMessage() );
						}
						
					} else {
						logger.info("Error in offerReplaceToCandidate() while sending SMS, cellular phone number was not found for user id : " + offerEmpForm.getIdNumber());
					}
				}
			}
				 
		} catch (ShfException e) {
			e.printStackTrace();
			logger.error("error in offerReplaceToCandidate() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}	
	}
	
	public void offerReplaceToMulitpleCandidates(ReplaceByCritrion myShiftId, Vector<ReplaceByCritrion> offerToShifts, String baseURL, SHFSmsSender smsSender) throws ShfException	{
		logger.debug("Starting offerReplaceToMulitpleCandidates()");
		if (myShiftId == null || offerToShifts == null || offerToShifts.size() == 0) {
			logger.error("error in offerReplaceToMulitpleCandidates() ");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		Vector<String> offerToShiftsIds = new Vector<String>();
		for (ReplaceByCritrion offer : offerToShifts) {
			offerToShiftsIds.add(offer.getShiftId());
		}
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);

		if ( ! simpleFactoryDao.insertShiftsToReplaceForSwitch(myShiftId.getShiftId(), offerToShiftsIds) ) {
			logger.error("error in offerReplaceToMulitpleCandidates() while insert ");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		Collection<Integer> empIDs = new Vector<Integer>();
		empIDs.add(Integer.parseInt( myShiftId.getEmployeeId()));
		
		FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE);
		Iterator iter = offerToShifts.iterator();
		while (iter.hasNext())	{
			ReplaceByCritrion offerTo = (ReplaceByCritrion)iter.next();
			ReplaceMassage replaceMassage = new ReplaceMassage();
			replaceMassage.setEmpId(Integer.parseInt(offerTo.getEmployeeId()));
			replaceMassage.setSubject("הצעה להחלפה");
			replaceMassage.setText(buildMassage(myShiftId,offerTo,OFFER_REPLACE));
			replaceMassage.setNote("");
			replaceMassage.setMsgType(FactoryDao.MSG_TYPE_OFFER_REPLACE);
			replaceMassage.setShiftId(Integer.parseInt(offerTo.getShiftId()));
			replaceMassage.setShiftStart(offerTo.getStartTime());
			replaceMassage.setShiftEnd(offerTo.getEndTime());
			replaceMassage.setOfferShiftId(Integer.parseInt(myShiftId.getShiftId()));
			replaceMassage.setOfferShiftStart(myShiftId.getStartTime());
			replaceMassage.setOfferShiftEnd(myShiftId.getEndTime());
			replaceMassage.setOfferEmployeeId(Integer.parseInt(myShiftId.getEmployeeId())); // TODO is null
			replaceMassage.setOfferFullName(myShiftId.getFullname());
			factoryDao.insert(replaceMassage);
			empIDs.add(Integer.parseInt(offerTo.getEmployeeId()));
		}
		boolean agafAllowedSMS = false;
		try {
			agafAllowedSMS = "1".equals(SHFParameters.getAgafSendSwitchOfferSMS(SHFTableUtils.getAgafCodeOf(myShiftId.getEmployeeOrgUnit())).getValue());
		} catch (Exception e) {
			logger.error("Error in offerReplaceToMulitpleCandidates() while retrieving parameter 'AgafSendSwitchOfferSMS', error : "+e.getMessage());
		}
		if ( agafAllowedSMS ) {	// if agaf allowed to send SMS for switch proposals
		
			Vector<EmployeeBean> emp = null;
			try {
				emp = new EmployeeDataModel(new EmployeeDataForm()).populateEmployees(empIDs.toArray(new Integer[empIDs.size()]));
			} catch (Exception e) {
				logger.error("Error in offerReplaceToMulitpleCandidates() while populate employee for sending SMS : " + e.getMessage());
			}
			if (emp != null && emp.size() > 0) {
				
//				Vector<String> vec = new Vector<String>();
				Map<String, Vector<String>> sendData = new Hashtable<String, Vector<String>>();
				
				for (EmployeeBean empBean : emp) {	// loop and send SMS
					if ( "1".equals(empBean.getReceiveSwitchSMS()) && empBean.getEmployeeId() != Integer.parseInt(myShiftId.getEmployeeId()) ) { // if SMS receiving is enabled per user
						if (empBean.getPhoneCellular() != null && empBean.getPhoneCellular() != "" ) {
							for (ReplaceByCritrion offerTo : offerToShifts) {
								if ( empBean.getEmployeeId() == Integer.parseInt(offerTo.getEmployeeId()) ) {
//									vec.add(empBean.getPhoneCellular());
									String key = SHFUtils.formatDateToString(offerTo.getStartTime(), "dd/MM");
									if ( ! sendData.containsKey(key)) {
										Vector<String> tmp = new Vector<String>();
										tmp.add(empBean.getPhoneCellular());
										sendData.put(key, tmp);
										
									} else {
										sendData.get(key).add(empBean.getPhoneCellular());
									}
//									test.add(offerTo);
								}
							}
						} else {
							logger.info("Error in offerReplaceToMulitpleCandidates() while sending SMS, cellular phone number was not found for user id : " + empBean.getIdNumber());
						}
					}
				}
				
				if ( ! sendData.isEmpty()) {
					 
					for (String key : sendData.keySet()) {
						
						String msg = SHFConstants.SMS_SWITCH_MSG_PARAM.replace("{@}", key);
						
						smsSender.setVecTo(sendData.get(key));
						smsSender.setMessage(msg);
						
						try {
							smsSender.sendSHFSmsQueueMessage();
						} catch (ShfException e) {
							logger.error("Error in offerReplaceToMulitpleCandidates() while sending SMS : " + e.getMessage() );
						}
						
//						System.out.println("key: " + key + " value: " + test.get(key));

					}
				}
				
				
//				if (vec.size() > 0) {
//					smsSender.setVecTo(vec);
//					smsSender.setMessage(SHFConstants.SMS_SWITCH_MSG_PARAM);
//					try {
//						smsSender.sendSHFSmsQueueMessage();
//					} catch (ShfException e) {
//						logger.error("Error in offerReplaceToMulitpleCandidates() while sending SMS : " + e.getMessage() );
//					}
//				}

			}
			
			

			
//			offerReplaceSendSMS(myShiftId, emp, offerToShifts);
		}
	}
	
/**
 * Function to send SMS upon sending shift switch requests
 * 	
 * @param myShiftId
 * @param emp
 * @param offerToShifts
 */
//	public void offerReplaceSendSMS(ReplaceByCritrion myShiftId, Vector<EmployeeBean> emp, Vector<ReplaceByCritrion> offerToShifts) {
//		if (myShiftId == null || (emp == null || emp.size() == 0) || (offerToShifts == null || offerToShifts.size() == 0)) {
//			logger.error("Error in offerReplaceSendSMS(), params are not valid (null or empty)");
//			return;
//		}
//		
//		boolean agafAllowedSMS = false;
//		try {
//			agafAllowedSMS = "1".equals(SHFParameters.getAgafSendSwitchOfferSMS(SHFTableUtils.getAgafCodeOf(myShiftId.getEmployeeOrgUnit())).getValue());
//		} catch (Exception e) {
//			logger.error("Error in offerReplaceSendSMS() while retrieving parameter 'AgafSendSwitchOfferSMS', error : "+e.getMessage());
//		}
//		
//		if ( agafAllowedSMS ) {		// if agaf allowed to send SMS for switch proposals
//			for (EmployeeBean empBean : emp) {	// loop and send SMS
//				if ( "1".equals(empBean.getReceiveSwitchSMS()) ) { // if SMS receiving is enabled per user
//					if (empBean.getPhoneCellular() != null && empBean.getPhoneCellular() != "" ) {
//						for (ReplaceByCritrion offerTo : offerToShifts) {
//							if ( empBean.getEmployeeId() == Integer.parseInt(offerTo.getEmployeeId()) ) {
////								String SMS_API_SERVER = "http://localhost/tellme/shfTest.php";
////								String SMS_API_ACCOUNT = "AccountName";
////								String SMS_API_USER = "AccountUser";
////								String SMS_API_PASS = "AccountPass";
////								String SMS_API_FROM = "BEZEQ";
////								String SMS_API_TO = empBean.getPhoneCellular();
////								String SMS_API_PORT = "0";
////								String SMS_API_TEXT = empBean.getFname()+" שלום " +
////								"התקבלה בקשת החלפה מ "+myShiftId.getFullname()+" עם משמרת שלך ב "+SHFUtils.formatDateToString(offerTo.getStartTime(),"dd/MM/yyyy HH:mm")+"-"+SHFUtils.formatDateToString(offerTo.getEndTime(),"HH:mm")+
////								" במשמרת שלהם "+SHFUtils.formatDateToString(myShiftId.getStartTime(),"dd/MM/yyyy HH:mm")+"-"+SHFUtils.formatDateToString(myShiftId.getEndTime(),"HH:mm");
//								
////								try {
////									URLConnection connection = new URL(SMS_API_SERVER + "?" + "p1=1").openConnection();
////									connection.connect();
////								} catch (MalformedURLException e) {
////									// TODO Auto-generated catch block
////									e.printStackTrace();
////								} catch (IOException e) {
////									// TODO Auto-generated catch block
////									e.printStackTrace();
////								}
//								
////								String url = SHFConstants.SMS_URL;
////								String charset = "UTF-8";  // Or in Java 7 and later, use the constant: java.nio.charset.StandardCharsets.UTF_8.name()
////								String ACCOUNT = SMS_API_ACCOUNT;
////								String USER = SMS_API_USER;
////								String PASS = SMS_API_PASS;
////								String FROM = SMS_API_FROM;
//								String TO = "972"+empBean.getPhoneCellular().substring(1);
////								String PORT = SMS_API_PORT;
//								String TEXT = "שלום,"+
//								"התקבלה בקשה לאישורך להחלפת משמרת בתאריך "+SHFUtils.formatDateToString(offerTo.getStartTime(),"dd/MM")+
//								"בברכה, בזק.";
//
//								
//								String query = "";
//								try {
//									query = String.format("ACCOUNT=%s&USER=%s&PASS=%s&FROM=%s&TO=%s&PORT=%s&TEXT=%s",
//											URLEncoder.encode(SHFConstants.SMS_ACCOUNT, 	SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(SHFConstants.SMS_USER, 		SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(SHFConstants.SMS_PASS, 		SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(SHFConstants.SMS_FROM,		SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(TO,							SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(SHFConstants.SMS_PORT, 		SHFConstants.SMS_CHARSET),
//											URLEncoder.encode(TEXT, 						SHFConstants.SMS_CHARSET)
//									);
//								} catch (UnsupportedEncodingException e) {
//									// TODO Auto-generated catch block
//									e.printStackTrace();
//								}
//								
//								URLConnection connection;
//								try {
//									connection = new URL(SHFConstants.SMS_URL + "?" + query).openConnection();
//									connection.setRequestProperty("Accept-Charset", SHFConstants.SMS_CHARSET);
////									InputStream response = connection.getInputStream();
//									
////									response.close();
//								} catch (MalformedURLException e) {
//									// TODO Auto-generated catch block
//									e.printStackTrace();
//									logger.error("URL Error : "+e);
//								} catch (IOException e) {
//									// TODO Auto-generated catch block
//									e.printStackTrace();
//									logger.error("Connection Error : "+e);
//								}
//
//							}
//						}
//					} else {
//						logger.error("Error in offerReplaceSendSMS() while sending SMS, cellular phone number was not found, user id : " + empBean.getIdNumber());
//					}
//				}
//			}
//		}
//	}
	
	public void cancelReplaceToCandidate(ReplaceByCritrion myShiftId,ReplaceByCritrion offerToShift) throws ShfException	{
		logger.debug("Starting cancelReplaceToCandidate()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			if (!simpleFactoryDao.cancelOfferShift(myShiftId.getShiftId(),offerToShift.getShiftId()))	throw new ShfException("shift "+myShiftId.getShiftId()+" fail cancel offer to shift "+offerToShift.getShiftId());
						
			ReplaceMassage replaceMassage;
			replaceMassage = new ReplaceMassage();
			replaceMassage.setEmpId(Integer.parseInt(offerToShift.getEmployeeId()));
			replaceMassage.setSubject("ביטול הצעה להחלפה");
			replaceMassage.setText(buildMassage(myShiftId,offerToShift,CANCEL_MY_OFFER));
			replaceMassage.setNote("");
			replaceMassage.setMsgType(FactoryDao.MSG_TYPE_CANCEL_OFFER);
			replaceMassage.setShiftId(Integer.parseInt(offerToShift.getShiftId()));
			replaceMassage.setShiftStart(offerToShift.getStartTime());
			replaceMassage.setShiftEnd(offerToShift.getEndTime());
			replaceMassage.setOfferShiftId(Integer.parseInt(myShiftId.getShiftId()));
			replaceMassage.setOfferShiftStart(myShiftId.getStartTime());
			replaceMassage.setOfferShiftEnd(myShiftId.getEndTime());
			replaceMassage.setOfferEmployeeId(Integer.parseInt(myShiftId.getEmployeeId())); // TODO is null
			replaceMassage.setOfferFullName(myShiftId.getFullname());
			
			FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE); 
			
			factoryDao.insert(replaceMassage);
				 
		} catch (ShfException e) {
			e.printStackTrace();
			logger.error("error in cancelReplaceToCandidate() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}	
	}
	
	public boolean rejectReplaceOffer(OfferReplaceByCritrion rejectShift,String note) throws ShfException	{
		logger.debug("Starting rejectReplaceOffer()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		boolean isRejectReplaceOffer = false;
		try {			
			if (simpleFactoryDao.rejectReplaceOffer(rejectShift.getShiftId(),rejectShift.getOffer(),ReplaceByCritrionDao.OPEN_REPLACE_STATUS,ReplaceByCritrionDao.WAIT_FOR_ANS_STATUS))	{
				buildMassages(rejectShift,"דחיית הצעתך",note,REJECT_REPLACE_OFFER);
				isRejectReplaceOffer = true;	
			}									
				 
		} catch (ShfException e) {
			e.printStackTrace();
			logger.error("error in rejectReplaceOffer() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}	
		return isRejectReplaceOffer;
	}
	
	
	private boolean checkReplacement(OfferReplaceByCritrion offerReplaceByCritrion) throws ShfException{
		logger.debug("Starting checkReplacement()");
		
		Vector ModifiedEmployeeWeekShifts = null;
		Vector employeeWeekShifts = null;		
		boolean isCheckReplacement = false;
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);			
		ModifiedEmployeeWeekShifts = simpleFactoryDao.selectRangeShifts(offerReplaceByCritrion.getOfferStartTime(),offerReplaceByCritrion.getShiftId(),offerReplaceByCritrion.getEmployeePersonalId());
		employeeWeekShifts = simpleFactoryDao.selectRangeShifts(offerReplaceByCritrion.getStartTime(),offerReplaceByCritrion.getOffer(),offerReplaceByCritrion.getOfferEmployeeIdNum());
		String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(offerReplaceByCritrion.getAllowedAgaf()).getValue();
		long minHoursBeforeSwitchNum = SHFUtils.parseLong(minHoursBeforeSwitch,SimpleFactoryDao.DEFUALT_TIME_BEFORE_SHIFT_BEGIN)*SimpleFactoryDao.HOUR_IN_MILLI;						
		String minHoursBetweenShifts = SHFParameters.getMinHoursBetweenShifts(offerReplaceByCritrion.getAllowedMoked()).getValue();
		long minHoursBetweenShiftsNum = SHFUtils.parseLong(minHoursBetweenShifts,SimpleFactoryDao.DEFUALT_EMPLOYEE_MIN_TIME_BETWEEN_TWO_SHIFTS)*SimpleFactoryDao.HOUR_IN_MILLI;						

		
		// in the same week replace shifts
		DateFormat df = new SimpleDateFormat("HH 'hours', mm 'mins,' ss 'seconds'");
		if(!SHFUtils.formatDateToString(offerReplaceByCritrion.getStartTime(),"ww").equals(SHFUtils.formatDateToString(offerReplaceByCritrion.getOfferStartTime(),"ww")))
			throw new ShfException("the two shifts not in the same week shift "+offerReplaceByCritrion.getShiftId()+" in week "+SHFUtils.formatDateToString(offerReplaceByCritrion.getStartTime(),"ww")+" and shift "+offerReplaceByCritrion.getOffer()+" in week "+SHFUtils.formatDateToString(offerReplaceByCritrion.getOfferStartTime(),"ww"));
		//
//		System.out.println("agaf: "+offerReplaceByCritrion.getAllowedAgaf()+", min param: "+df.format(minHoursBeforeSwitchNum)+", start1 - now = "+df.format(offerReplaceByCritrion.getStartTime().getTime()-System.currentTimeMillis()));
		if (!(offerReplaceByCritrion.getStartTime().getTime()-System.currentTimeMillis()>minHoursBeforeSwitchNum))
			throw new ShfException("not enough hours between start of shift "+offerReplaceByCritrion.getShiftId());
		
		if (!(offerReplaceByCritrion.getOfferStartTime().getTime()-System.currentTimeMillis()>minHoursBeforeSwitchNum)){
//			System.out.println("agaf: "+offerReplaceByCritrion.getAllowedAgaf()+", min param: "+df.format(minHoursBeforeSwitchNum)+", start2 - now = "+df.format(offerReplaceByCritrion.getOfferStartTime().getTime()-System.currentTimeMillis()));
			throw new ShfException("not enough hours between start of shift "+offerReplaceByCritrion.getOffer());
		}
		
		if (!checkGapBetweenShifts(ModifiedEmployeeWeekShifts,offerReplaceByCritrion.getOfferStartTime(),offerReplaceByCritrion.getOfferEndTime(),minHoursBetweenShiftsNum))
			throw new ShfException("not enough gap for replace shifts "+offerReplaceByCritrion.getShiftId()+" on shift "+offerReplaceByCritrion.getOffer());
		if (!checkGapBetweenShifts(employeeWeekShifts,offerReplaceByCritrion.getOfferStartTime(),offerReplaceByCritrion.getOfferEndTime(),minHoursBetweenShiftsNum))	
			throw new ShfException("not enough gap for replace shifts "+offerReplaceByCritrion.getShiftId()+" on shift "+offerReplaceByCritrion.getOffer());
		isCheckReplacement = true;			
		return isCheckReplacement;
	}

	public boolean checkGapBetweenShifts(Vector shifts,Date startTime,Date endTime,long minHoursBetweenShiftsNum) {
		logger.debug("Starting checkGapBetweenShifts()");
		
		boolean isCheckGapBetweenShifts = false;
		ReplaceByCritrion replaceByCritrion = null;
		Iterator iter = null;
		if (shifts!=null)	{
			iter = shifts.iterator();
			while (iter.hasNext())	{
				replaceByCritrion = (ReplaceByCritrion)iter.next();
				if (!(replaceByCritrion.getStartTime().getTime()-endTime.getTime()>minHoursBetweenShiftsNum) && !(startTime.getTime()-replaceByCritrion.getEndTime().getTime()>minHoursBetweenShiftsNum))
					return 	isCheckGapBetweenShifts;
			}
		}		
		isCheckGapBetweenShifts = true;
		return  isCheckGapBetweenShifts;		
	}
	
	
	public boolean 	acceptReplaceOffer(OfferReplaceByCritrion acceptShift,String note)	throws ShfException{
		logger.debug("ReplaceModel Starting acceptReplaceOffer()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		boolean isAcceptReplaceOffer = false;
		Vector replacementOffer = null;
		String offerId = acceptShift.getOffer();

		if (!checkReplacement(acceptShift))
			return 	isAcceptReplaceOffer;
		if (simpleFactoryDao.acceptReplaceOffer(acceptShift,ReplaceByCritrionDao.CLOSE_REPLACE,ReplaceByCritrionDao.WAIT_FOR_ANS_STATUS, getsCtx())){
			buildMassages(acceptShift,"קבלת הצעתך",note,ACCEPT_REPLACE_OFFER);				
			replacementOffer = simpleFactoryDao.selectReplacementOffer(acceptShift.getShiftId());
			
			if(replacementOffer != null)	{
				Iterator iter = replacementOffer.iterator();

				while (iter.hasNext())	{
					ReplaceByCritrion offer = ((ReplaceByCritrion)iter.next());
					acceptShift.setOfferEmployeeId(offer.getEmployeeId());
					acceptShift.setOffer(offer.getShiftId());
					acceptShift.setOfferStartTime(offer.getStartTime());
					acceptShift.setOfferEndTime(offer.getEndTime());
					acceptShift.setOfferFullName(offer.getFullname());
					acceptShift.setOfferManagerId(offer.getManagerId());
					
					buildMassages( acceptShift,"דחיית הצעה","",REJECT_REPLACE_OFFER );
				}
				if (!simpleFactoryDao.updateReplacementOfferToOpen(acceptShift.getShiftId(), offerId))
					return 	isAcceptReplaceOffer;					
			}
			
			isAcceptReplaceOffer = true;
			logger.info("Successfully switched between agents " + acceptShift.getFullname() + " and " + acceptShift.getOfferFullName());
		}												
		
		return isAcceptReplaceOffer;
	}
	
	// use for reject offer or accept offer 
	public void buildMassages(OfferReplaceByCritrion offerReplaceByCritrion,String subject,String note,int action)	throws ShfException	{
		logger.debug("Starting buildMassages()");
		
		ReplaceByCritrion fromShift = null;
		ReplaceByCritrion toShift = null;
		fromShift= (ReplaceByCritrion)offerReplaceByCritrion;
		toShift  = new ReplaceByCritrion();
		toShift.setEmployeeId(offerReplaceByCritrion.getOfferEmployeeId());
		toShift.setShiftId(offerReplaceByCritrion.getOffer());
		toShift.setStartTime(offerReplaceByCritrion.getOfferStartTime());
		toShift.setEndTime(offerReplaceByCritrion.getOfferEndTime());
		toShift.setFullname(offerReplaceByCritrion.getOfferFullName());
		toShift.setManagerId(offerReplaceByCritrion.getOfferManagerId());
		buildMassages(fromShift,toShift,subject,note,action);
	}

	
	public void buildMassages(ReplaceByCritrion fromShift,ReplaceByCritrion toShift,String subject,String note,int action)	throws ShfException	{
		logger.debug("Starting buildMassages()");
		String msgType = null;
		if (action == REJECT_REPLACE_OFFER) {
			msgType = FactoryDao.MSG_TYPE_REJECT_OFFER;
		} else if (action == ACCEPT_REPLACE_OFFER) {
			msgType = FactoryDao.MSG_TYPE_ACCEPT_OFFER;
		}
		 
		ReplaceMassage replaceMassage = new ReplaceMassage();
		
		replaceMassage.setEmpId(Integer.parseInt(toShift.getEmployeeId()));
		replaceMassage.setSubject(subject);
		replaceMassage.setText(buildMassage(fromShift,toShift,action));
		replaceMassage.setNote(note);
		replaceMassage.setMsgType(msgType);
		replaceMassage.setShiftId(Integer.parseInt(toShift.getShiftId()));
		replaceMassage.setShiftStart(toShift.getStartTime());
		replaceMassage.setShiftEnd(toShift.getEndTime());
		
		replaceMassage.setOfferShiftId(Integer.parseInt(fromShift.getShiftId()));
		replaceMassage.setOfferShiftStart(fromShift.getStartTime());
		replaceMassage.setOfferShiftEnd(fromShift.getEndTime());
		replaceMassage.setOfferEmployeeId(Integer.parseInt(fromShift.getEmployeeId())); // TODO is null
		replaceMassage.setOfferFullName(fromShift.getFullname());
		
		FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE);
		factoryDao.insert(replaceMassage);
		/*if (informManagers)	{
			replaceMassage.setEmpId(Integer.parseInt(toShift.getManagerId()));
			factoryDao.insert(replaceMassage);
			if (!toShift.getManagerId().equals(fromShift.getManagerId()))	{
				replaceMassage.setEmpId(Integer.parseInt(fromShift.getManagerId()));
				factoryDao.insert(replaceMassage);
			}
		}*/
	}
	
	/**
	 * Function to remove shift from repository
	 * @param myShiftId 
	 * @return boolean
	 */
	public boolean cancelShiftReplace(ReplaceByCritrion myShiftId)	{
		logger.debug("Starting cancelShiftReplace()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		Vector replacementOffer = null;
		boolean isCancelShiftReplace = false;
		try {			
			if (!simpleFactoryDao.updateMyShiftToCancelReplace(myShiftId.getShiftId(),ReplaceByCritrionDao.CANCEL_REPLACE))
				return 	isCancelShiftReplace;			
			replacementOffer = simpleFactoryDao.selectReplacementOffer(myShiftId.getShiftId());
			if(replacementOffer!=null)	{
				Vector<String> shiftsIdVec = new Vector<String>();	// to retrieve all shifts from repository
				
				// send reject messages to offers
				Iterator iter = replacementOffer.iterator();
				FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE);
				ReplaceMassage replaceMassage = null;
				while (iter.hasNext())	{		
					ReplaceByCritrion shiftOffer = (ReplaceByCritrion)iter.next();
					replaceMassage = new ReplaceMassage();
					replaceMassage.setEmpId(Integer.parseInt(shiftOffer.getEmployeeId()));
					replaceMassage.setSubject("דחייה עקב ביטול החלפה");
					replaceMassage.setText(buildMassage(myShiftId,shiftOffer,REJECT_BECAUSE_CANCEL_REPLACE));
					replaceMassage.setNote("");
					replaceMassage.setMsgType(FactoryDao.MSG_TYPE_REJECT_OFFER);
					replaceMassage.setShiftId(Integer.parseInt(shiftOffer.getShiftId()));
					replaceMassage.setShiftStart(shiftOffer.getStartTime());
					replaceMassage.setShiftEnd(shiftOffer.getEndTime());
					replaceMassage.setOfferShiftId(Integer.parseInt(myShiftId.getShiftId()));
					replaceMassage.setOfferShiftStart(myShiftId.getStartTime());
					replaceMassage.setOfferShiftEnd(myShiftId.getEndTime());
					replaceMassage.setOfferEmployeeId(Integer.parseInt(myShiftId.getEmployeeId())); // TODO is null
					replaceMassage.setOfferFullName(myShiftId.getFullname());
					factoryDao.insert(replaceMassage);
					shiftsIdVec.add(shiftOffer.getShiftId());
				}
				
				///// START Igal 2.2015 multiple offers update, set OPEN only if have one offer (to my shift)
				// if also have offers to others then delete only offer to my shift
				
				// 1st, get all shifts from repository (and 2nd then check if who offered me also offered to others (then delete only that offer)
				// or only has single offer, to my shift(then set status to "OPEN"))
				Vector<OfferReplaceByCritrion> shiftsInRepVec = simpleFactoryDao.selectShiftsInReplaceRepository(null, null, null);
				Vector<OfferReplaceByCritrion> offersToDelete = new Vector<OfferReplaceByCritrion>();
				Vector<OfferReplaceByCritrion> offersToUpdateToOpen = new Vector<OfferReplaceByCritrion>();
				
				// 2nd, check if offers have more then 1 offer
				for ( int i=0; i<replacementOffer.size(); i++ )	{
					int occurrences = 0;
					Vector<OfferReplaceByCritrion> tmp = new Vector<OfferReplaceByCritrion>();
					for ( int j=0; j<shiftsInRepVec.size(); j++ )	{
						if ( ((ReplaceByCritrion)replacementOffer.get(i)).getShiftId().equals( ((OfferReplaceByCritrion)shiftsInRepVec.get(j)).getShiftId() ) ) {
							occurrences++;
						}
						if ( ((ReplaceByCritrion)replacementOffer.get(i)).getShiftId().equals( ((OfferReplaceByCritrion)shiftsInRepVec.get(j)).getShiftId() )
							&& ((OfferReplaceByCritrion)shiftsInRepVec.get(j)).getOffer().equals( myShiftId.getShiftId() )
							) {
							tmp.add( (OfferReplaceByCritrion)shiftsInRepVec.get(j) );
						}
					}
					if ( occurrences > 1 ) {
						if (tmp.size() > 0) {	// 11.2015 update. tmp is 0
							offersToDelete.add(tmp.get(0));
						}
					} else {
						if (tmp.size() > 0) {	// 11.2015 update. tmp is 0
							offersToUpdateToOpen.add(tmp.get(0));
						}
					}
				}
				if ( offersToDelete.size() > 0 ) {	// the offerer(s) also offered to others, therefore delete only offers to me (their other offers remain in WAIT_FOR_ANS_STATUS status)
					if ( ! simpleFactoryDao.deleteOffersToMeFromRepository(myShiftId.getShiftId(), offersToDelete) ) return isCancelShiftReplace;
				}
				if ( offersToUpdateToOpen.size() > 0 ) {	// offerer(s) offered to me ONLY, update to OPEN since my shift removed from repository
					if ( ! simpleFactoryDao.updateReplacementOfferToOpen(myShiftId.getShiftId(), offersToUpdateToOpen) ) return isCancelShiftReplace;
				}
				///// END Igal 2.2015 multiple offers update
				
//				if (!simpleFactoryDao.updateReplacementOfferToOpen(myShiftId.getShiftId()))		// Igal 2.2015 multiple offers update, original code
//					return 	isCancelShiftReplace;												// Igal 2.2015 multiple offers update, original code								
			}		
			isCancelShiftReplace = simpleFactoryDao.deleteShiftFromRepository(myShiftId.getShiftId());	 
		} catch (ShfException e) {
			e.printStackTrace();
		}
		return isCancelShiftReplace;	
	}


	
	public Vector lookForOffers(String myShiftId)	{
		logger.debug("Starting lookForOffers()");
		
		Vector replaceOffer = null;
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			replaceOffer = simpleFactoryDao.selectReplacementOffer(myShiftId);
		} catch (ShfException e) {
			e.printStackTrace();
		}
		return replaceOffer;
	}
	
	public  Vector<OfferReplaceByCritrion> lookForOffers( Vector<String> shiftsIdVec )	{
		logger.debug("Starting lookForOffers()");
		
		Vector replaceOffer = null;
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			replaceOffer = simpleFactoryDao.selectReplacementOffer(shiftsIdVec);
		} catch (ShfException e) {
			e.printStackTrace();
		}
		return replaceOffer;
	}
	
	private String buildMassage(ReplaceByCritrion myShiftId,ReplaceByCritrion offerToShift, int action)	{
		logger.debug("Starting buildMassage()");
				
		StringBuffer sb = new StringBuffer("");
		String massage = null;
		String fullname=myShiftId.getFullname();
		Date myStartTime=myShiftId.getStartTime();
		Date myEndTime=myShiftId.getEndTime();
		Date offerStartTime=offerToShift.getStartTime();
		Date offerEndTime=offerToShift.getEndTime();
		switch (action)	{
			case OFFER_REPLACE:
					sb.append(fullname+" מציע לך להחליף אותו במשמרתו המתחילה ב "+
					SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy HH:mm")+" ומסתיימת ב "+
					SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy HH:mm"));
					sb.append("\n");
					sb.append("במשמרת שלך המתחילה ב "+
					SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm")+" ומסתיימת ב "+
					SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm"));
					
					break;
					
			case  CANCEL_MY_OFFER:
					sb.append(fullname+" מבטל את הצעתו להחליף משמרת שלו ב ");
					sb.append(SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy HH:mm"));
					sb.append(" ומסתיימת ב");
					sb.append(SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy HH:mm"));
					sb.append("\n");
					sb.append(" במשמרת שלך המתחילה ב ");
					sb.append(SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm"));
					sb.append(" ומסתיימת ב");
					sb.append(SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm"));
					
					break;
					
			case REJECT_BECAUSE_CANCEL_REPLACE:
					sb.append(fullname+
					" דוחה את הצעתך להחליף משמרת שלך ב"+SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm")+
					" ומסתיימת ב "+SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm"));	
					sb.append("\n");
					
					sb.append(" במשמרת שלו המתחילה ב "+SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy HH:mm")+
					" ומסתיימת ב "+SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy HH:mm"));			
					sb.append("\n");
					sb.append("עקב ביטול החלפת משמרתו");										
					
					break;
					
			case REJECT_REPLACE_OFFER:	
					sb.append(fullname+
					" דוחה את הצעתך להחליף משמרת שלך ב"+SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm")+
					" ומסתיימת ב "+SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm"));	
					sb.append("\n");
							
					sb.append(" במשמרת שלו המתחילה ב "+SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy HH:mm")+
					" ומסתיימת ב "+SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy HH:mm"));									
					
					break;		
						
			case ACCEPT_REPLACE_OFFER:
					sb.append(fullname+" קיבל הצעתך להחליפך במשמרתך ב "+
					SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy HH:mm")+" ומסתיימת ב "+
					SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy HH:mm"));
					sb.append("\n");
					sb.append("במשמרת שלו המתחילה ב "+	
					SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm")+" ומסתיימת ב "+
					SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm"));
					
					
					break;	
			default:
				
				break;
				
			
		}		
		massage = sb.toString();
		return massage;
	}
	
	
	public void insertShiftToRepository(String myShiftId, String note)	{
		logger.debug("Starting insertShiftToRepository()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			if (!simpleFactoryDao.insertShiftToReplace(myShiftId,null,ReplaceByCritrionDao.OPEN_REPLACE_STATUS, note))	throw new ShfException("shift "+myShiftId+" fail to insert");
				 
		} catch (ShfException e) {
			e.printStackTrace();
		}	
	}


	public Vector findSuitableCandidates(Vector myShifts,Vector candidatesForReplace,long minHoursBetweenShifts)	{
		logger.debug("Starting findSuitableCandidates()");
//		Date date = new Date();
//		SimpleDateFormat ft = new SimpleDateFormat ("HH:mm:ss:SS");
//		System.out.println("findSuitableCandidates() time : "+ft.format(new Date()));
		
		Vector candidateSuitable = null;
		Iterator myShiftsIter = null;
		Iterator candidatesForReplaceIter = null;
		ReplaceByCritrion myShiftsRec = null;
		ReplaceByCritrion candidatesForReplaceRec = null;
		boolean isSuitable = true;
		
			candidatesForReplaceIter = candidatesForReplace.iterator();
			
			while (candidatesForReplaceIter.hasNext())	{
				isSuitable = true;
				candidatesForReplaceRec = (ReplaceByCritrion)candidatesForReplaceIter.next();
				if(myShifts!=null){
				
					myShiftsIter = myShifts.iterator();
					while(myShiftsIter.hasNext())	{
						myShiftsRec = (ReplaceByCritrion)myShiftsIter.next();
						
//						SimpleDateFormat sdf1 = new SimpleDateFormat ("dd/MM HH:mm");
//						System.out.println("candidate start: "+sdf1.format(new Date(candidatesForReplaceRec.getStartTime().getTime()))+" - my end: " +sdf1.format(new Date(myShiftsRec.getEndTime().getTime())) + " || " +"my start: "+sdf1.format(new Date(myShiftsRec.getStartTime().getTime()))+" - candidate end: " +sdf1.format(new Date(candidatesForReplaceRec.getEndTime().getTime()))   );
//						System.out.println( (candidatesForReplaceRec.getStartTime().getTime()-myShiftsRec.getEndTime().getTime()>=minHoursBetweenShifts) +" || "+ (myShiftsRec.getStartTime().getTime()-candidatesForReplaceRec.getEndTime().getTime()>=minHoursBetweenShifts));
						
						if (!( candidatesForReplaceRec.getStartTime().getTime()-myShiftsRec.getEndTime().getTime()>=minHoursBetweenShifts || 
						myShiftsRec.getStartTime().getTime()-candidatesForReplaceRec.getEndTime().getTime()>=minHoursBetweenShifts ))	{
//							System.out.println("not suitable - minHoursBetweenShifts");
							isSuitable = false;
							break;
						}
							
					}
				}
				if (isSuitable)		{
					if (candidateSuitable==null)
						candidateSuitable = new Vector();			
					candidateSuitable.add(candidatesForReplaceRec);					
				}

			}		
		
		return candidateSuitable;
	}

	public boolean isExistInRepository(String shiftId)	{
		logger.debug("Starting isExistInRepository()");
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		try {			
			return simpleFactoryDao.isExistInRepository(shiftId);					 
		} catch (ShfException e) {
			e.printStackTrace();
		}	
		return false;
	}
	
//	Yuval 10.05.09
	public void checkValidShiftCandidate(long shiftId) throws ShfException {
		logger.debug("Starting checkValidShiftCandidate()");
		
		AgentDayBean shiftInfo=ShiftDataModel.populateShift(shiftId);
		ShfBaseBean bean=(ShfBaseBean)replaceByCritrionForm;
		Boolean isAgent = true;
		
		if(bean.getAllowedActivities().contains("replace_admin")){
			isAgent = false;
		}

		
//		if(shiftInfo.getShiftSource().startsWith("f")){
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.replaceFailedShiftSource", null));
//			throw new ShfException(actionErrors);
//		}
		if(shiftInfo.getStageArrivalTime()!=null || shiftInfo.getStationArrivalTime()!=null || shiftInfo.getMissingReasonId()>0 ){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.replaceFailedAttend",null));	
			throw new ShfException(actionErrors);
		}
		
		if (shiftInfo.getShiftExtNum() != null) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.replaceFailedPoolExt",null));	
			throw new ShfException(actionErrors);
		}
		
		String moked=SHFTableUtils.getUnitCodeOfSite(shiftInfo.getSiteId());
		String agaf=(moked==null?null:SHFTableUtils.getAgafCodeOf(moked));
		String hoursBeforeSwitch=SHFParameters.getMinHoursBeforeSwitch(agaf).getValue();
		Calendar cal=Calendar.getInstance();
		cal.setTime(shiftInfo.getShiftStart());
		cal.add(Calendar.HOUR_OF_DAY,-1*Integer.parseInt(hoursBeforeSwitch));
		if(cal.getTime().before(new Date())){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.replaceFailedCloseTime",hoursBeforeSwitch));					
			throw new ShfException(actionErrors);
			
		}
		
		if(ExceptionDataModel.isShiftContainsExceptions(shiftId) || shiftInfo.isShiftSplit()){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.switchShiftHasExceptions"));
			throw new ShfException(actionErrors);
		}
		ShiftDataModel.checkIfSwitchBreakMade(shiftId);
	}
	
	public Vector<AgentDayBean> checkShiftsForSwitch( Vector<AgentDayBean> dayShiftsList, ReplaceByCritrion myShift ) throws ShfException {
		Vector<AgentDayBean> finalResult = new Vector<AgentDayBean>();
		Vector<ReplaceByCritrion> resultTmp = null;
		Vector<ReplaceByCritrion> finalResultTmp = null;
		
		if ( dayShiftsList != null ) {
			// preliminary filter, remove past shifts, only shifts that start after now+param
			Vector<AgentDayBean> dayShiftsListFiltered = new Vector<AgentDayBean>();
			String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(SHFTableUtils.getAgafCodeOf(SHFTableUtils.getUnitCodeOfSite(myShift.getSite()))).getValue();
			double minHoursBeforeSwitchNum = SHFUtils.parseLong(minHoursBeforeSwitch,SimpleFactoryDao.DEFUALT_TIME_BEFORE_SHIFT_BEGIN);
			Date now = new Date();
			for ( AgentDayBean dayBean : dayShiftsList ) {
				if(dayBean.getShiftStart() != null) {
					if ((dayBean.getShiftStart().getTime() - now.getTime()) > minHoursBeforeSwitchNum*60*60*1000) {
						dayShiftsListFiltered.add(dayBean);
					}
				}

			}	// preliminary filter END
			
			Vector<OfferReplaceByCritrion> shiftsInRepository = getShiftsInReplaceRepository(null, null , null);	// for later removal
			Vector<ExceptionSearchBean> exceptionsList = ExceptionDataModel.populateExcepByDayVec(dayShiftsListFiltered);	// for later removal
			Vector<BreakCandidateBean> breaksInRepository = BreakDataModel.populateBreakCandidatesByDayVec(dayShiftsListFiltered);	// for later removal
			
			
			int mylen=SHFUtils.getMinutesBetween(myShift.getStartTime(),myShift.getEndTime());
			int diff_param=0;
			diff_param=Integer.parseInt(SHFParameters.getMaxDifferenceForSwitch( SHFTableUtils.getAgafCodeOf(SHFTableUtils.getUnitCodeOfSite(myShift.getSite())) ).getValue());
			
			resultTmp = new Vector<ReplaceByCritrion>();
			 
			for ( AgentDayBean dayBean : dayShiftsListFiltered ) {
//				dayBean.getShiftStart()
				String moked=SHFTableUtils.getUnitCodeOfSite(dayBean.getSiteId());
				String agaf=(moked==null?null:SHFTableUtils.getAgafCodeOf(moked));
				String hoursBeforeSwitch=SHFParameters.getMinHoursBeforeSwitch(agaf).getValue();
				Calendar cal=Calendar.getInstance();
				cal.setTime(dayBean.getShiftStart());
				cal.add(Calendar.HOUR_OF_DAY,-1*Integer.parseInt(hoursBeforeSwitch));
				
				// check the diff netween length of shifts not exceeding param
				int len=SHFUtils.getMinutesBetween(dayBean.getShiftStart(),dayBean.getShiftEnd());
				if(!(Math.abs(len-mylen)<=diff_param)){
//					System.out.println("not adding - MinutesBetween shift length");
					continue;
				}
				
				//check if two inner jobs can switch one with the other
				if(!SHFTableUtils.isInnerJobsSwitchable(dayBean.getInnerJobId(),myShift.getInnerJob())){
//					System.out.println("not adding - InnerJobsSwitchable");
					continue;
				}
				
				// check same times
				if(myShift.getStartTime().equals(dayBean.getShiftStart()) && myShift.getEndTime().equals(dayBean.getShiftEnd())){
//					System.out.println("not adding - same times");
					continue;
				}
				
				// if this replace option is a night shift , check if sites are equal
				AgentDayBean tmp=new AgentDayBean();
				tmp.setWmShiftStartTime(myShift.getStartTime());
				if(tmp.isNeightShift() && !myShift.getSite().equals(dayBean.getSiteId())){
//					System.out.println("not adding - night shift and NOT same sites");
					continue;
				}
				
				// remove: my shifts, stage/station arrived or missing
				if ( dayBean.getEmpIdNumber().equals(myShift.getEmployeePersonalId())
						|| dayBean.getStageArrivalTime() != null 
						|| dayBean.getStationArrivalTime() != null 
						|| dayBean.getMissingReasonId() > 0
						/*|| cal.getTime().before(new Date())*/ ) {	// -> moved to method start
					continue;
				}
					
				boolean noGood = false;	
				if ( shiftsInRepository != null ) {
					for ( OfferReplaceByCritrion shiftInRepository : shiftsInRepository ) {
						if ( String.valueOf(dayBean.getAgentDayId()).equals(shiftInRepository.getShiftId()) ) {	// remove shifts in repository
							noGood = true;
							break;
						}
					}
				}
				if (noGood) continue;
				
				if ( exceptionsList != null ) {
					for ( ExceptionSearchBean exception : exceptionsList ) {
						if ( dayBean.getAgentDayId() == exception.getAgentDayId() ) {	// remove shifts with exceptions
							noGood = true;
							break;
						}
					}
				}
				if (noGood) continue;
				
				if ( breaksInRepository != null ) {
					for ( BreakCandidateBean breakInRep : breaksInRepository ) {
						if ( dayBean.getAgentDayId() == breakInRep.getAgentDayId() ) {	// remove shifts with breaks in repository
							noGood = true;
							break;
						}
					}
				}
				if (noGood) continue;
				
				ReplaceByCritrion replaceByCritrion = new ReplaceByCritrion();
				replaceByCritrion.setShiftId(String.valueOf(dayBean.getAgentDayId()));
				replaceByCritrion.setEmployeePersonalId(dayBean.getEmpIdNumber());
				replaceByCritrion.setSite(dayBean.getSiteId());
				replaceByCritrion.setStartTime(dayBean.getShiftStart());
				replaceByCritrion.setEndTime(dayBean.getShiftEnd());
				resultTmp.add(replaceByCritrion);
				
//				finalResult.add(dayBean);
				
			}
			
			// check min param between two shifts after switch both ways
			AgentDayBean tmp=new AgentDayBean();
			tmp.setWmEmpIdNumber(myShift.getEmployeePersonalId());
			tmp.setWmShiftStartTime(myShift.getStartTime());
			tmp.setWmShiftEndTime(myShift.getEndTime());
			tmp.setWmSiteId(myShift.getSite());
			
			SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
			finalResultTmp = simpleFactoryDao.checkShiftsInRange(resultTmp, tmp);
			
			if ( finalResultTmp != null && finalResultTmp.size() > 0 ) {
				for ( AgentDayBean dayBean : dayShiftsListFiltered ) {
					for ( ReplaceByCritrion replaceByCritrionTmp : finalResultTmp ) {
						if ( String.valueOf(dayBean.getAgentDayId()).equals(replaceByCritrionTmp.getShiftId()) ) {
							finalResult.add(dayBean);
						}
					}
				}
			}
		
		}
		return finalResult;
	}
	
	public Vector<Map<String, String>> getMaxOffersForShiftReplace( Vector<String> shiftIds ) throws ShfException {
		logger.debug("ReplaceModel getMaxOffersForShiftReplace()");
		Vector<Map<String, String>> result = null;
		
		if ( shiftIds == null || shiftIds.size() < 1 ) return result;
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT t.shf_employee_day_id, count(*) as offeredTotal ");
		sql.append("FROM shifter.shf_replace_candidates t ");
		sql.append("WHERE t.shf_employee_day_id in (");
		Iterator<String> iter = shiftIds.iterator();
		while (iter.hasNext()) {
			iter.next();
			sql.append("?");
			if(iter.hasNext()) {
				sql.append(",");
			}
		}
		sql.append(")");
		sql.append("AND t.status = ? ");
		sql.append("AND t.offer IS NOT NULL ");
		sql.append("GROUP BY t.shf_employee_day_id ");
		
		int param = 1;
		DBAccess dBAccess = null;
		
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			
			for (String shiftId : shiftIds) {
				dBAccess.setInt(param++, Integer.valueOf(shiftId));
			}
			dBAccess.setString(param++, SimpleFactoryDao.WAIT_FOR_ANS_STATUS);
			
			dBAccess.executeQuery();
			result = new Vector<Map<String, String>>();
			while (dBAccess.next()) {
				Map<String, String> tmpMap = new HashMap<String, String>();
				tmpMap.put(String.valueOf(dBAccess.getInt(1)), String.valueOf(dBAccess.getInt(2)));
				result.add(tmpMap);
			}
			
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error on ReplaceByCritrionDao getMaxOffersForShiftReplace() " + e.getMessage());
			throw new ShfException("error on ReplaceModel.java getMaxOffersForShiftReplace()", e);
		} finally{
			try {
				dBAccess.close();				
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
		
		
		return result;
	}


	public ServletContext getsCtx() {
		return sCtx;
	}


	public void setsCtx(ServletContext sCtx) {
		this.sCtx = sCtx;
	}

	/*public boolean checkValidSource(long shiftId) throws ShfException {
		boolean retVal = false;
		DBAccess db=new DBAccess();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT * ");
		sql.append("FROM SHIFTER.SHF_EMPLOYEE_DAY ");
		sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? AND SOURCE IN "+ SHFConstants.VALID_SOURCE_FOR_REPLACE);
		//sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? AND SOURCE IN ( ? ) ");
		
		try {
			db.prepareStatement(sql.toString());
			
			
			db.setLong(param_index++, shiftId);
			//db.setString(param_index++, SHFConstants.VALID_SOURCE_FOR_REPLACE);
			db.executeQuery();
			
			if (db.next())	{ 
				retVal = true; 
				} 

		} catch(DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftSource", null));					
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}

	return retVal;
	}*/
}
