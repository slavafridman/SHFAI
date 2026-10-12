/*

 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Date;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Set;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBDuplicateKeyException;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBQuerySQLException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.ActivityAimBean;
import bzq.shf.bean.InnerJobBean;

import bzq.shf.bean.ActualJobBean;
import bzq.shf.forms.ActivityAimForm;
import bzq.shf.forms.ActualJobForm;
import bzq.shf.forms.InnerJobForm;
import bzq.shf.forms.SystemAdminForm;
import bzq.shf.forms.SystemParameterForm;
import bzq.shf.transfer.SkillForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
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
public class SystemAdminModel {
	
	private static Logger logger = Logger.getLogger(SystemAdminModel.class);
	private SystemAdminForm adminForm;
	private SkillForm skillForm;
	private InnerJobForm innerJobForm;
	private ActivityAimBean  activityAimBean;
	private ActualJobForm  actualJobForm;
	private ActualJobBean  actualJobBean;
	
	private SystemParameterForm minutesBeforeLate = null;
	private SystemParameterForm lockEmployees = null;
	private SystemParameterForm lockMissingNum = null;
	private SystemParameterForm minBetweenShifts = null;
	private SystemParameterForm minBeforeSwitch = null;
	private SystemParameterForm minBeforeSwitchBreak = null;
	private SystemParameterForm minimalShiftDuration = null;
	private SystemParameterForm minimalBreakLate = null;
	private SystemParameterForm minimalBreakShifting = null;
	private SystemParameterForm maxMinutesToExitAfterEnd = null;
	private SystemParameterForm maxDifferenceForSwitch = null; 
	private SystemParameterForm minBeforeReduceRequest = null;
	private SystemParameterForm minBeforeChangeRequest = null;
	private SystemParameterForm minimalShiftDurationForCR = null;
	private SystemParameterForm maximalShiftDurationForCR = null;
	private SystemParameterForm maxToExitBeforEndShift = null;
	private SystemParameterForm minTimeFromNextShift = null;
	private SystemParameterForm minTimeFromLastShift = null;
	private SystemParameterForm maxSelectForSwitchOffer = null;
	private SystemParameterForm agafSendSwitchOfferSMS = null;
	private SystemParameterForm managedBreakMinTimeBeforeChange = null;
	private SystemParameterForm managedBreakEnabled = null;
	private SystemParameterForm iwdMinAfterShiftStart = null;
	private SystemParameterForm iwdMinBeforeShiftEnd = null;
	private SystemParameterForm iwdDefaultTimeToComplete = null;
	private SystemParameterForm iwdRescheduleOnAgentBreak = null;
	private SystemParameterForm poolEnabled = null;
	private SystemParameterForm poolTimeBeforeShiftStart = null;
	private SystemParameterForm poolTimeAfterShiftEnd = null;
	private SystemParameterForm poolTimeNoArrival = null;
	
	
	public SystemAdminModel(SkillForm form) {
		this.skillForm=form;
	}
	public SystemAdminModel(ActualJobForm form) {
		this.actualJobForm=form;
	}
	
	public SystemAdminModel(InnerJobForm form){
		this.innerJobForm=form;
	}
	public SystemAdminModel(ActivityAimForm form) {
		this.activityAimBean=form;
	}
	public SystemAdminModel(SystemAdminForm form){
		adminForm=form;
		//parameters for agaf
		if(adminForm.getMoked()==null || adminForm.getMoked().equals("-1")){
			minBeforeSwitch=SHFParameters.getMinHoursBeforeSwitch(adminForm.getAgaf());
			maxDifferenceForSwitch=SHFParameters.getMaxDifferenceForSwitch(adminForm.getAgaf());
			setMaxSelectForSwitchOffer(SHFParameters.getMaximumSelectForSwitchOffer(adminForm.getAgaf()));
			agafSendSwitchOfferSMS = (SHFParameters.getAgafSendSwitchOfferSMS(adminForm.getAgaf()));
			managedBreakMinTimeBeforeChange = (SHFParameters.getManagedBreakMinTimeBeforeChange(adminForm.getAgaf()));
			iwdMinAfterShiftStart = (SHFParameters.getIwdMinAfterShiftStart(adminForm.getAgaf()));
			iwdMinBeforeShiftEnd = (SHFParameters.getIwdMinBeforeShiftEnd(adminForm.getAgaf()));
			iwdDefaultTimeToComplete = (SHFParameters.getIwdDefaultTimeToComplete(adminForm.getAgaf()));
			iwdRescheduleOnAgentBreak = (SHFParameters.getIwdRescheduleOnAgentBreak(adminForm.getAgaf()));
		}else{
			minutesBeforeLate=SHFParameters.getMinutesBeforeLateParam(adminForm.getMoked());
			lockEmployees=SHFParameters.getLockEmployeesParam(adminForm.getMoked());
			lockMissingNum=SHFParameters.getMissingNumParam(adminForm.getMoked());
			minBetweenShifts=SHFParameters.getMinHoursBetweenShifts(adminForm.getMoked());
			minBeforeSwitchBreak=SHFParameters.getMinHoursBeforeSwitchBreak(adminForm.getMoked());
			minimalShiftDuration=SHFParameters.getMinimalShiftDuration(adminForm.getMoked());
			minimalBreakLate=SHFParameters.getMinimalBreakLate(adminForm.getMoked());
			minimalBreakShifting=SHFParameters.getMinimalBreakShifting(adminForm.getMoked());
			maxMinutesToExitAfterEnd=SHFParameters.getMaxMinutesToExitAfterEnd(adminForm.getMoked());
			minBeforeReduceRequest=SHFParameters.getMinutesBeforeReduceRequest(adminForm.getMoked());
			minBeforeChangeRequest=SHFParameters.getMinutesBeforeChangeRequest(adminForm.getMoked());
			minimalShiftDurationForCR=SHFParameters.getMinimalShiftDurationForCR(adminForm.getMoked());
			maximalShiftDurationForCR=SHFParameters.getMaximalShiftDuration(adminForm.getMoked());
			maxToExitBeforEndShift=SHFParameters.getMaxToExitBeforEndShift(adminForm.getMoked());
			minTimeFromLastShift=SHFParameters.getMinimumTimeFromLastSHift(adminForm.getMoked());
			minTimeFromNextShift=SHFParameters.getMinimumTimeFromNextSHift(adminForm.getMoked());
			managedBreakEnabled = SHFParameters.getManagedBreakEnabled(adminForm.getMoked());
			poolEnabled = SHFParameters.getPoolEnabled(adminForm.getMoked());
			poolTimeBeforeShiftStart = SHFParameters.getPoolExtAllocateTimeBeforeShiftStart(adminForm.getMoked());
			poolTimeAfterShiftEnd = SHFParameters.getPoolExtReturnTimeAfterShiftEnd(adminForm.getMoked());
			poolTimeNoArrival = SHFParameters.getPoolExtReturnTimeNoArrival(adminForm.getMoked());
		}
	}
	
	
	public void viewSystemParameters() {
		logger.debug("Starting viewSystemParameters()");
		if(adminForm.getMoked()==null || adminForm.getMoked().equals("-1")){
			adminForm.setMinHoursBeforeSwitch(SHFParameters.getMinHoursBeforeSwitch(adminForm.getAgaf()).getValue());
			adminForm.setMaxDifferenceForSwitch(SHFParameters.getMaxDifferenceForSwitch(adminForm.getAgaf()).getValue());
			adminForm.setMaxSelectForSwitchOffer(SHFParameters.getMaximumSelectForSwitchOffer(adminForm.getAgaf()).getValue());
			adminForm.setAgafSendSwitchOfferSMS(Boolean.valueOf(SHFParameters.getAgafSendSwitchOfferSMS(adminForm.getAgaf()).getValue()));
			adminForm.setManagedBreakMinTimeBeforeChange(SHFParameters.getManagedBreakMinTimeBeforeChange(adminForm.getAgaf()).getValue());
			adminForm.setIwdMinAfterShiftStart((SHFParameters.getIwdMinAfterShiftStart(adminForm.getAgaf())).getValue());
			adminForm.setIwdMinBeforeShiftEnd((SHFParameters.getIwdMinBeforeShiftEnd(adminForm.getAgaf())).getValue());
			adminForm.setIwdDefaultTimeToComplete((SHFParameters.getIwdDefaultTimeToComplete(adminForm.getAgaf())).getValue());
			adminForm.setIwdRescheduleOnAgentBreak(Boolean.valueOf(SHFParameters.getIwdRescheduleOnAgentBreak(adminForm.getAgaf()).getValue()));
		}else{
			adminForm.setMinutesBeforeLate(SHFParameters.getMinutesBeforeLateParam(adminForm.getMoked()).getValue());
			adminForm.setLockEmployees(Boolean.valueOf(SHFParameters.getLockEmployeesParam(adminForm.getMoked()).getValue()));
			adminForm.setLockMissingNum(SHFParameters.getMissingNumParam(adminForm.getMoked()).getValue());
			adminForm.setMinHoursBetweenShifts(SHFParameters.getMinHoursBetweenShifts(adminForm.getMoked()).getValue());
			adminForm.setMinHoursBeforeSwitchBreak(SHFParameters.getMinHoursBeforeSwitchBreak(adminForm.getMoked()).getValue());
			adminForm.setMinimalShiftDuration(SHFParameters.getMinimalShiftDuration(adminForm.getMoked()).getValue());
			adminForm.setMinimalBreakLate(SHFParameters.getMinimalBreakLate(adminForm.getMoked()).getValue());
			adminForm.setMinimalBreakShifting(SHFParameters.getMinimalBreakShifting(adminForm.getMoked()).getValue());
			adminForm.setMaxMinutesToExitAfterEnd(SHFParameters.getMaxMinutesToExitAfterEnd(adminForm.getMoked()).getValue());
			adminForm.setMinBeforeReduceRequest(SHFParameters.getMinutesBeforeReduceRequest(adminForm.getMoked()).getValue());
			adminForm.setMinBeforeChangeRequest(SHFParameters.getMinutesBeforeChangeRequest(adminForm.getMoked()).getValue());
			adminForm.setMinimalShiftDurationForCR(SHFParameters.getMinimalShiftDurationForCR(adminForm.getMoked()).getValue());
			adminForm.setMaximalShiftDurationForCR(SHFParameters.getMaximalShiftDuration(adminForm.getMoked()).getValue());
			adminForm.setMaxToExitBeforEndShift(SHFParameters.getMaxToExitBeforEndShift(adminForm.getMoked()).getValue());
			adminForm.setMinTimeFromLastShift(SHFParameters.getMinimumTimeFromLastSHift(adminForm.getMoked()).getValue());
			adminForm.setMinTimeFromNextShift(SHFParameters.getMinimumTimeFromNextSHift(adminForm.getMoked()).getValue());
			adminForm.setManagedBreakEnabled(Boolean.valueOf(SHFParameters.getManagedBreakEnabled(adminForm.getMoked()).getValue()));
			adminForm.setPoolEnabled(Boolean.valueOf(SHFParameters.getPoolEnabled(adminForm.getMoked()).getValue()));
			adminForm.setPoolTimeBeforeShiftStart(SHFParameters.getPoolExtAllocateTimeBeforeShiftStart(adminForm.getMoked()).getValue());
			adminForm.setPoolTimeAfterShiftEnd(SHFParameters.getPoolExtReturnTimeAfterShiftEnd(adminForm.getMoked()).getValue());
			adminForm.setPoolTimeNoArrival(SHFParameters.getPoolExtReturnTimeNoArrival(adminForm.getMoked()).getValue());
		}
	}


	/**
	 * 
	 */
	public void saveParameters() throws ShfException {
		logger.debug("Starting saveParameters()");
		logger.info("save parameters");
		
		//parameters for agaf
		if(adminForm.getMoked()==null || adminForm.getMoked().equals("-1")){
//			System.out.println("moked NULL, agaf params");
			if(minBeforeSwitch.getParamValue()!=null){
//				System.out.println("agaf param update minBeforeSwitch");
				updateParam(minBeforeSwitch,adminForm.getMinHoursBeforeSwitch());
			}
			else insertParam(minBeforeSwitch,adminForm.getMinHoursBeforeSwitch());
			
			if(maxDifferenceForSwitch.getParamValue()!=null){
//				System.out.println("agaf param update maxDifferenceForSwitch");
				updateParam(maxDifferenceForSwitch,adminForm.getMaxDifferenceForSwitch());
			}
			else insertParam(maxDifferenceForSwitch,adminForm.getMaxDifferenceForSwitch());
			
			if(maxSelectForSwitchOffer.getParamValue()!=null){
				updateParam(maxSelectForSwitchOffer,adminForm.getMaxSelectForSwitchOffer());
			}
			else insertParam(maxSelectForSwitchOffer,adminForm.getMaxSelectForSwitchOffer());
			
			if(agafSendSwitchOfferSMS.getParamValue()!=null){
				updateParam(agafSendSwitchOfferSMS,String.valueOf(adminForm.isAgafSendSwitchOfferSMS()));
			}
			else insertParam(agafSendSwitchOfferSMS,String.valueOf(adminForm.isAgafSendSwitchOfferSMS()));
			
			if(managedBreakMinTimeBeforeChange.getParamValue()!=null){
				updateParam(managedBreakMinTimeBeforeChange,adminForm.getManagedBreakMinTimeBeforeChange());
			}
			else insertParam(managedBreakMinTimeBeforeChange,adminForm.getManagedBreakMinTimeBeforeChange());
			// -----------------
			if(iwdMinAfterShiftStart.getParamValue()!=null){
				updateParam(iwdMinAfterShiftStart,adminForm.getIwdMinAfterShiftStart());
			}
			else insertParam(iwdMinAfterShiftStart,adminForm.getIwdMinAfterShiftStart());
			
			if(iwdMinBeforeShiftEnd.getParamValue()!=null){
				updateParam(iwdMinBeforeShiftEnd,adminForm.getIwdMinBeforeShiftEnd());
			}
			else insertParam(iwdMinBeforeShiftEnd,adminForm.getIwdMinBeforeShiftEnd());
			
			if(iwdDefaultTimeToComplete.getParamValue()!=null){
				updateParam(iwdDefaultTimeToComplete,adminForm.getIwdDefaultTimeToComplete());
			}
			else insertParam(iwdDefaultTimeToComplete,adminForm.getIwdDefaultTimeToComplete());
			
			if(iwdRescheduleOnAgentBreak.getParamValue()!=null){
				updateParam(iwdRescheduleOnAgentBreak,String.valueOf(adminForm.isIwdRescheduleOnAgentBreak()));
			}
			else insertParam(iwdRescheduleOnAgentBreak,String.valueOf(adminForm.isIwdRescheduleOnAgentBreak()));
			
		}else{ //parameters for moked			
		
			if(minutesBeforeLate.getParamValue()!=null)
				updateParam(minutesBeforeLate,adminForm.getMinutesBeforeLate());
			else insertParam(minutesBeforeLate,adminForm.getMinutesBeforeLate());
			
			if(lockEmployees.getParamValue()!=null)
				updateParam(lockEmployees,String.valueOf(adminForm.isLockEmployees()));
			else insertParam(lockEmployees,String.valueOf(adminForm.isLockEmployees()));
	
			if(lockMissingNum.getParamValue()!=null)
				updateParam(lockMissingNum,adminForm.getLockMissingNum());
			else insertParam(lockMissingNum,adminForm.getLockMissingNum());
			
			if(minBetweenShifts.getParamValue()!=null)
				updateParam(minBetweenShifts,adminForm.getMinHoursBetweenShifts());
			else insertParam(minBetweenShifts,adminForm.getMinHoursBetweenShifts());	
			
			if(minBeforeSwitchBreak.getParamValue()!=null)
				updateParam(minBeforeSwitchBreak,adminForm.getMinHoursBeforeSwitchBreak());
			else insertParam(minBeforeSwitchBreak,adminForm.getMinHoursBeforeSwitchBreak());
			
			if(minimalShiftDuration.getParamValue()!=null)
				updateParam(minimalShiftDuration,adminForm.getMinimalShiftDuration());
			else insertParam(minimalShiftDuration,adminForm.getMinimalShiftDuration());
			
			if(minimalBreakLate.getParamValue()!=null)
				updateParam(minimalBreakLate,adminForm.getMinimalBreakLate());
			else insertParam(minimalBreakLate,adminForm.getMinimalBreakLate());
			
			if(minimalBreakLate.getParamValue()!=null)
				updateParam(minimalBreakShifting,adminForm.getMinimalBreakShifting());
			else insertParam(minimalBreakShifting,adminForm.getMinimalBreakShifting());
			
			if(maxMinutesToExitAfterEnd.getParamValue()!=null)
				updateParam(maxMinutesToExitAfterEnd,adminForm.getMaxMinutesToExitAfterEnd());
			else insertParam(maxMinutesToExitAfterEnd,adminForm.getMaxMinutesToExitAfterEnd());
			
			if(minBeforeReduceRequest.getParamValue()!=null)
				updateParam(minBeforeReduceRequest,adminForm.getMinBeforeReduceRequest());
			else insertParam(minBeforeReduceRequest,adminForm.getMinBeforeReduceRequest());
	
			if(minBeforeChangeRequest.getParamValue()!=null)
				updateParam(minBeforeChangeRequest,adminForm.getMinBeforeChangeRequest());
			else insertParam(minBeforeChangeRequest,adminForm.getMinBeforeChangeRequest());
				
			if(maximalShiftDurationForCR.getParamValue()!=null)
				updateParam(maximalShiftDurationForCR,adminForm.getMaximalShiftDurationForCR());
			else insertParam(maximalShiftDurationForCR,adminForm.getMaximalShiftDurationForCR());
	
			if(minimalShiftDurationForCR.getParamValue()!=null)
				updateParam(minimalShiftDurationForCR,adminForm.getMinimalShiftDurationForCR());
			else insertParam(minimalShiftDurationForCR,adminForm.getMinimalShiftDurationForCR());
			
			if(maxToExitBeforEndShift.getParamValue()!=null)
				updateParam(maxToExitBeforEndShift,adminForm.getMaxToExitBeforEndShift());
			else insertParam(maxToExitBeforEndShift,adminForm.getMaxToExitBeforEndShift());
			
			if(minTimeFromLastShift.getParamValue()!=null)
				updateParam(minTimeFromLastShift,adminForm.getMinTimeFromLastShift());
			else insertParam(minTimeFromLastShift,adminForm.getMinTimeFromLastShift());
			
			if(minTimeFromNextShift.getParamValue()!=null)
				updateParam(minTimeFromNextShift,adminForm.getMinTimeFromNextShift());
			else insertParam(minTimeFromNextShift,adminForm.getMinTimeFromNextShift());
			
			if(managedBreakEnabled.getParamValue()!=null)
				updateParam(managedBreakEnabled,String.valueOf(adminForm.isManagedBreakEnabled()));
			else insertParam(managedBreakEnabled,String.valueOf(adminForm.isManagedBreakEnabled()));
			
			if(poolEnabled.getParamValue()!=null)
				updateParam(poolEnabled,String.valueOf(adminForm.isPoolEnabled()));
			else insertParam(poolEnabled,String.valueOf(adminForm.isPoolEnabled()));
			
			if(poolTimeBeforeShiftStart.getParamValue()!=null)
				updateParam(poolTimeBeforeShiftStart,String.valueOf(adminForm.getPoolTimeBeforeShiftStart()));
			else insertParam(poolTimeBeforeShiftStart,String.valueOf(adminForm.getPoolTimeBeforeShiftStart()));
			
			if(poolTimeAfterShiftEnd.getParamValue()!=null)
				updateParam(poolTimeAfterShiftEnd,String.valueOf(adminForm.getPoolTimeAfterShiftEnd()));
			else insertParam(poolTimeAfterShiftEnd,String.valueOf(adminForm.getPoolTimeAfterShiftEnd()));
			
			if(poolTimeNoArrival.getParamValue()!=null)
				updateParam(poolTimeNoArrival,String.valueOf(adminForm.getPoolTimeNoArrival()));
			else insertParam(poolTimeNoArrival,String.valueOf(adminForm.getPoolTimeNoArrival()));
			
		}
		
		SharingUtils.reloadTables(TablesConstants.SYSTEM_PARAM);
		
		throw new ShfException(new ActionError("shf.success.updateSecceeded"));
	}
	
	/**
	 * @param minutesBeforeLate
	 * @param string
	 */
	private void insertParam(SystemParameterForm param, String value) throws ShfException {
		logger.debug("Starting insertParam()");
		StringBuffer sql=new StringBuffer();
		sql.append("insert into SHIFTER.shf_unit_param(PARAM_KEY,ORG_UNIT_ID,PARAM_VALUE,MIDIFICATION_TIME,MIDIFICATION_USER) values(?,?,?,?,?)");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,param.getCode());
			if(adminForm.getMoked()==null || adminForm.getMoked().equals("-1")){
				db.setString(2,adminForm.getAgaf());
			}else{
				db.setString(2,adminForm.getMoked());
			}
			db.setString(3,value);
			db.setTimestamp(4,new Date());
			db.setString(5,adminForm.getUserFirstName()+" "+adminForm.getUserLastName());
			db.executeUpdate();
		} catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
	}


	/**
	 * @param minutesBeforeLate
	 * @param string
	 */
	private void updateParam(SystemParameterForm param, String value) throws ShfException {
		logger.debug("Starting updateParam()");
//		System.out.println("Starting updateParam()");
		StringBuffer sql=new StringBuffer();
		
		sql.append("update SHIFTER.shf_unit_param t set t.param_value = ? , t.MIDIFICATION_TIME=? , t.MIDIFICATION_USER=? where t.param_key = ? and t.org_unit_id = ?");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,value);
			db.setTimestamp(2,new Date());
			db.setString(3,adminForm.getUserFirstName()+" "+adminForm.getUserLastName());
			db.setString(4,param.getCode());
			if(adminForm.getMoked()==null || adminForm.getMoked().equals("-1")){
				db.setString(5,adminForm.getAgaf());
			}else{
				db.setString(5,adminForm.getMoked());
			}
			db.executeUpdate();
		} catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
	}


	private void reloadParameters(){
		logger.debug("Starting reloadParameters()");
		
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		LoadTables loader=new LoadTables(tc);
		try {
			loader.loadParameters();
		} catch (DBException e) {
			e.printStackTrace();
		}
	}
	
	private void reloadSkills(){
		logger.debug("Starting reloadSkills()");
		/*
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		LoadTables loader=new LoadTables(tc);
		try {
			loader.loadSkills();
		} catch (DBException e) {
			e.printStackTrace();
		}*/
		SharingUtils.reloadTables(TablesConstants.SKILL_TABLE);
	}
	
	public void populateSkill() throws ShfException{
		logger.debug("Starting populateSkill()");
		
		StringBuffer sql=new StringBuffer();

		sql.append("SELECT * FROM SHIFTER.SHF_SKILLS s WHERE s.SKILL_ID = ?");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,skillForm.getSkillId());
			db.executeQuery();
			if(db.next()){
				db.populate(skillForm);
			}
		} catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	//tamar
	
	
	public void populateActivity() throws ShfException{
		logger.debug("Starting populateActivity()");
		
		StringBuffer sql=new StringBuffer();

		sql.append("SELECT * FROM shifter.shf_activity_call_time_aim  s WHERE s.activity_type_id = ?");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,activityAimBean.getVirtualActivity());
			db.executeQuery();
			db.populate(activityAimBean);
			String[][] tmpMatrix=new String[7][24];
			int i = 0;
			ActivityAimBean  activity = null;
			while(db.next()){
			//String[] activityAimArrayDay=new String[7];
			//activityAimArrayDay=activityAimBean.getActivityAim().split(",");
			//for(int i=0;i<7;i++){
				activity=new ActivityAimBean();
				db.populate(activity);
				String[] activityAimArray=new String[24];
				activityAimArray=activity.getActivityAim().split(";");
				for(int j=0;j<24;j++){
				  tmpMatrix[i][j]=activityAimArray[j];
					}
				i++;
				}
			
			activityAimBean.setActivityAimArray(tmpMatrix);
			
		} catch (DBQueryNoRowsException e) {
			//donothing
		}catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	public Vector<ActivityAimBean> activityList()throws ShfException {
		logger.debug("beginning of populateActivityAim().");
		StringBuffer sSql=new StringBuffer();
		sSql.append("select *");
		sSql.append(" from shifter.shf_activity_call_time_aim d ");
		sSql.append("where d.activity_day = 1");
		
		Vector <ActivityAimBean> activityList = new Vector <ActivityAimBean>();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.executeQuery();
			dBAccess.populate("bzq.shf.bean.ActivityAimBean",activityList);
			return activityList;
		} catch(DBQueryNoRowsException e){
		} catch (DBException e) {
			logger.error("error in populateActivitylist() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sSql=null;
				dBAccess.close();
			} catch (DBException e) {
//				System.out.println("while closing db connection");
				logger.error("error in populateActivitylist() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		return activityList;
	}
/*	public void populateActivityAim() throws ShfException{
		logger.debug("Starting populateActivityAim()");
		
		StringBuffer sql=new StringBuffer();

		sql.append("select * from shf_activity_call_time_aim t ,shf_virtual_activities b");
		sql.append("where t.activity_type_id = b.virtual_activity_id ");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			if(db.next()){
				db.populate(activityAimForm);
			}
		} catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}*/
	public void saveActivityAim(String activityAim ) throws ShfException{
		logger.debug("Starting updateActivityAim()");
		StringBuffer sql=new StringBuffer();

		sql.append("update SHIFTER.SHF_ACTIVITY_CALL_TIME_AIM s set s.ACTIVITY_AIM = ? , ");
		sql.append("s.MODIFICATION_USER = ? , s.MODIFICATION_TIME =? WHERE s.ACTIVITY_TYPE_ID = ? and s.ACTIVITY_DAY = ?");
		DBAccess db=null;
		
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,activityAim);
			db.setString(2,activityAimBean.getUserId());
			db.setTimestamp(3,new Date());
			db.setString(4,activityAimBean.getVirtualActivity());
			db.setInteger(5,activityAimBean.getActivityDay());
			db.executeUpdate();
			
		} catch (DBException e) {
			logger.error("DB general error at saveActivityAim()", e);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	public void insertActivityAim(String activityAim) throws ShfException{
		logger.debug("Starting insertActivityAim()");
		StringBuffer sql=new StringBuffer();
		sql.append("insert into shifter.SHF_ACTIVITY_CALL_TIME_AIM (ACTIVITY_TYPE_ID,ACTIVITY_AIM,MODIFICATION_USER,ACTIVITY_DAY) values (?,?,?,?)");
		//sql.append("values (?,?,?)");
		
		DBAccess db=null;
		
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			if ("activity".equals(activityAimBean.getRbChoice())){
				db.setString(1,activityAimBean.getVirtualActivity());
			} else {
				db.setString(1,activityAimBean.getActivity());
			}
			db.setString(2,activityAim);
			//db.setTimestamp(3,new Date());
			db.setString(3,activityAimBean.getUserId());
			db.setInteger(4,activityAimBean.getActivityDay());
			db.executeUpdate();
			logger.debug("after insertActivityAim()");
		} catch (bzq.db.DBDuplicateKeyException e) { 
			logger.error("DB Error while insertActivityAim(), record already exists", e);
			throw new ShfException(new ActionError("error.db.duplicateCallAim"));
		} catch (DBException e) {
			logger.error("DB general error at insertActivityAim()", e);
		}
		finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	public void deleteActivityAim() throws ShfException{
		logger.debug("Starting deleteActivityAim()");
		StringBuffer sql=new StringBuffer();
		sql.append("delete from  shifter.SHF_ACTIVITY_CALL_TIME_AIM where ACTIVITY_TYPE_ID = ? ");
		
		DBAccess db=null;
		
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,activityAimBean.getVirtualActivity());
					
			db.executeUpdate();
		
		} catch (DBException e) {
			logger.error("DB general error at deleteActivityAim()", e);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	//
	
	public void updateSkill() throws ShfException{
		logger.debug("Starting updateSkill()");
		StringBuffer sql=new StringBuffer();

		sql.append("update SHIFTER.SHF_SKILLS t set t.SKILL_DESC = ? , t.IS_LANGUAGE=? WHERE t.SKILL_ID = ? ");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,skillForm.getSkillDesc());
			db.setInt(2,skillForm.getIsLanguage());
			db.setInt(3,skillForm.getSkillId());
			db.executeUpdate();
			reloadSkills();
		} catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	public void addInnerJob() throws ShfException{
		logger.debug("Starting addInnerJob()");
		StringBuffer sql=new StringBuffer();

		sql.append("INSERT INTO SHIFTER.shf_inner_jobs(INNER_JOB_ID,INNER_JOB_NAME,ORG_UNIT_ID,GROUP_ID,ACTIVE) values (SHIFTER.SHF_INNER_JOB_ID.nextval,?,?,?,?) ");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,innerJobForm.getDescription());
			db.setString(2,innerJobForm.getOrgUnit());
			db.setInt(3,innerJobForm.getGroupId());
			db.setInt(4,innerJobForm.getActive());
			db.executeUpdate();
		} catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	public void updateInnerJob() throws ShfException{
		logger.debug("Starting addInnerJob()");
		StringBuffer sql=new StringBuffer();

		sql.append("UPDATE SHIFTER.shf_inner_jobs set INNER_JOB_NAME=? , ORG_UNIT_ID=? , GROUP_ID=? , ACTIVE=? WHERE INNER_JOB_ID=? ");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,innerJobForm.getDescription());
			db.setString(2,innerJobForm.getOrgUnit());
			db.setInt(3,innerJobForm.getGroupId());
			db.setInt(4,innerJobForm.getActive());
			db.setString(5,innerJobForm.getCode());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error(e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	
	public void deleteInnerJob() throws ShfException{
		logger.debug("Starting addInnerJob()");
		StringBuffer sql1=new StringBuffer();
		StringBuffer sql2=new StringBuffer();
		sql1.append("SELECT count(*) FROM SHIFTER.shf_employees t WHERE t.INNER_JOB_ID=?");
		
		sql2.append("DELETE FROM SHIFTER.shf_inner_jobs WHERE INNER_JOB_ID=? ");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql1.toString());
			db.setString(1,innerJobForm.getCode());
			db.executeQuery();
			int count=db.getInt(1);
			if(count>0) throw new ShfException(new ActionError("shf.error.deleteRecordConnected"));
			
			db.prepareStatement(sql2.toString());
			db.setString(1,innerJobForm.getCode());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error(e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	public void actualJob() throws ShfException{
	}
	
	
	public Vector<ActualJobBean> populateCategoryJob() throws ShfException{
		logger.debug("Starting populateCategoryJob()");
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT distinct e.job_id, e.job_name , c.category_id as CATEGORY_ID, t.category_description as CATEGORY_DESCRIPTION ");
		sql.append("from shifter.shf_employees e ");
		sql.append("left join shifter.shf_category_job  c on e.job_id=c.job_id ");
		sql.append("left join shifter.shf_category_type  t on t.category_id=c.category_id ");
		sql.append("where e.job_id > 0 ");
		sql.append("order by e.job_id");
		
		DBAccess db=null;
		
		Vector<ActualJobBean> actualJobList=new Vector<ActualJobBean>();
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			ActualJobBean actualJob=null;
			while(db.next()){
				actualJob=new ActualJobBean();
				db.populate(actualJob);
				actualJobList.add(actualJob);
			}
			return actualJobList;
			
		} catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			e.printStackTrace();
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return actualJobList;
	}
	public  void updateCategoryJob(ActualJobForm actualJobForm) throws ShfException{
		logger.debug("Starting updateCategoryJob()");
		    if (actualJobForm.getCategoryId() == 0){
		    	deleteActualJob();
		    }else{	
		    	insertActualJob();
		    }	
			//	addActualJob();
			
				
			
		}
	
	
	
	public void findActualJob(boolean jobExist) throws ShfException{
		logger.debug("Starting findActualJob()");
		StringBuffer sql=new StringBuffer();
		int parm =1;
		sql.append("SELECT * from SHF_CATEGORY_JOB  c");
		sql.append("where  c.JOB_ID = ? ");
				DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInteger(parm++,actualJobBean.getJobId());
			db.setInteger(parm++,actualJobBean.getCategoryId());
			db.setString(parm,actualJobBean.getCategoryName());
			db.executeQuery();
			db.prepareStatement(sql.toString());
			db.executeUpdate();
			jobExist=true;  
		} catch(DBQueryNoRowsException e){	
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error(e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	public void insertActualJob() throws ShfException{
		logger.debug("Starting addActualJob()");
		StringBuffer sql=new StringBuffer();
		sql.append("insert into shifter.SHF_CATEGORY_JOB c (c.JOB_ID,c.CATEGORY_ID) values (?,?)");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInteger(1,actualJobForm.getJobId());
			db.setInteger(2,actualJobForm.getCategoryId());
			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){
			 updateActualJob();
		} catch(DBQuerySQLException e){
			 updateActualJob();	 
		} catch(DBDuplicateKeyException e){
			updateActualJob();
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error(e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	public void updateActualJob() throws ShfException{
		logger.debug("Starting updateActualJob()");
		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_CATEGORY_JOB c set c.CATEGORY_ID =? WHERE c.JOB_ID=? " );
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInteger(1,actualJobForm.getCategoryId());
			db.setInteger(2,actualJobForm.getJobId());
			db.executeUpdate();
			
	//	}catch(DBUpdateNoRowsException e1){	
	//		insertActualJob();
		}catch (DBException e) {
			//insertActualJob();
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			logger.debug("end updateActualJob()");
		}
	}
	public void deleteActualJob() throws ShfException{
		logger.debug("Starting updateActualJob()");
		StringBuffer sql=new StringBuffer();
		//sql.append("update shifter.SHF_CATEGORY_JOB (JOB_ID,JOB_NAME,CATEGORY_ID) values (?,?,?)");
		sql.append("delete shifter.SHF_CATEGORY_JOB  c  where c.JOB_ID = ?");
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInteger(1,actualJobForm.getJobId());
			db.executeUpdate();
		} catch(DBQueryNoRowsException e){	
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error(e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	public Hashtable<Integer, Set<InnerJobBean>> getInnerJobsGroups() {
		Hashtable<Integer, Set<InnerJobBean>> map=new Hashtable<Integer, Set<InnerJobBean>>();
		
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc = appRes.getTablesContainer();
		Vector jobstable = tc.getTable("innerJobCode");
		
		InnerJobBean innerJob=null;
		for(Object obj:jobstable){
			innerJob=(InnerJobBean)obj;
			if(innerJob.getOrgUnit()!=null && innerJob.getOrgUnit().equals(innerJobForm.getOrgUnit())){
				Set<InnerJobBean> groupSet=map.get(innerJob.getGroupId());
				if(groupSet==null){
					groupSet=new HashSet<InnerJobBean>();
					groupSet.add(innerJob);
					map.put(new Integer(innerJob.getGroupId()), groupSet);
				}else{
					groupSet.add(innerJob);
				}
			}
		}
		
		return map;
	}
	public void setMaxSelectForSwitchOffer(SystemParameterForm maxSelectForSwitchOffer) {
		this.maxSelectForSwitchOffer = maxSelectForSwitchOffer;
	}
	public SystemParameterForm getMaxSelectForSwitchOffer() {
		return maxSelectForSwitchOffer;
	}
	
}
