/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.StringTokenizer;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.forms.AttendanceDataForm;
import bzq.shf.forms.AttendanceSearchForm;
import bzq.shf.forms.EmployeeArriveForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EventReasonForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.ShiftLateException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;
 
/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AttendanceDataModel {
	private static Logger logger = Logger.getLogger(AttendanceDataModel.class);
	private AttendanceDataForm attendanceForm;
	
	public AttendanceDataModel(AttendanceDataForm form){
		this.attendanceForm=form;
	}
	
	public void populateAttendance() throws ShfException{
		logger.debug("beginning of populateAttendance()"); 
		
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");	
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("a.STAGE_ARRIVAL_TIME , ");
		sql.append("a.STATION_ARRIVAL_TIME , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		sql.append("a.STAGE_ARRIVAL_USER, ");
		sql.append("a.STATION_ARRIVAL_USER, ");
		sql.append("a.LATE_MINUTES, ");
		sql.append("a.LATE_REASON_ID, ");
		sql.append("a.MISS_REASON_ID, ");
		sql.append("a.MISSING_TIME, ");
		sql.append("a.OPTIONAL1, ");
		sql.append("a.MISSING_REMARK, ");
		sql.append("a.LATE_REMARK, ");
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
				
		sql.append("FROM SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_attendance a on d.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("WHERE d.SHF_EMPLOYEE_DAY_ID = ?");
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setLong(1,attendanceForm.getAgentDayId());
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			}

		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error on station attendance populateAttendance() " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in populateAttendance() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	private void populateAgentDay() throws ShfException{
		logger.debug("Starting populateAgentDay() dayId = " + attendanceForm.getAgentDayId());

		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");	
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		
		sql.append("FROM SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("WHERE d.SHF_EMPLOYEE_DAY_ID = ?");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setLong(1,attendanceForm.getAgentDayId());
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			}

		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateAgentDay() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in populateAgentDay() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void saveReportRequirment() throws ShfException{
		logger.info("Starting saveReportRequirment(), dayID = "+attendanceForm.getAgentDayId()+", empID = "+attendanceForm.getEmployeeId());
		int param=1;
		StringBuffer sql=new StringBuffer();
		sql.append("insert into SHIFTER.SHF_EMPLOYEE_REPORTS(SHF_EMPLOYEE_DAY_ID,EMPLOYEE_ID,CREATION_TIME,CREATION_USER) values(?,?,?,?) ");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param++,attendanceForm.getAgentDayId());
			db.setInt(param++,attendanceForm.getEmployeeId());
			db.setTimestamp(param++,new Date());
			db.setString(param++,attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error in saveReportRequirment() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("DB error in saveReportRequirment() : "+e.getMessage(), e);
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error in saveReportRequirment() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void addEvent() throws ShfException{
		logger.debug("AttendanceDataModel: beginning of addEvent.");
		int type=((AttendanceSearchForm)attendanceForm).getEventType();
		
		if(type==SHFConstants.MISSING_REASON){
			addMissing();
			EventReasonForm eventReason =SHFTableUtils.getEventReason(attendanceForm.getMissingReasonId());
			if(eventReason.getReportRequested()==1){
				saveReportRequirment();
				//Yuval - remark this
			}
		}
		else if(type==SHFConstants.LATE_REASON){
			String source=((EmployeeArriveForm)attendanceForm).getLateSource();
			if(source!=null){
				if(source.equals("stage")){
					addStageLate();
				}else if(source.equals("station")){
					addLate();
				}
			}
		}
		
	}
	
	public void addMissing() throws ShfException{
		logger.info("Starting addMissing() for shift "+attendanceForm.getAgentDayId()+" By "+attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
		updateMissing();
		if(attendanceForm.getAllowedMoked()!=null){
			if(SHFParameters.getLockEmployeesParam(attendanceForm.getAllowedMoked()).getValue().equals("true")){
				int missnum=Integer.parseInt(SHFParameters.getMissingNumParam(attendanceForm.getAllowedMoked()).getValue());
				populateAgentDay();
				if(checkLock(missnum)){
					EmployeeDataForm employeeForm=new EmployeeDataForm();
					employeeForm.setIdNumber(attendanceForm.getEmpIdNumber());
					EmployeeDataModel employee=new EmployeeDataModel(employeeForm);
					employee.lockEmployee();
				}
			}
		}
	}
		
	
	private void updateMissing() throws ShfException{
		logger.debug("Starting updateMissing() ");

		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_ATTENDANCE ");
		sql.append("SET MISS_REASON_ID=? , ");
		sql.append("MISSING_TIME = ? , ");
		sql.append("STAGE_ARRIVAL_USER = ? , ");
		sql.append("MISSING_REMARK = ? ");
		sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ?");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(1,((AttendanceSearchForm)attendanceForm).getMissingReasonId());
			dBAccess.setTimestamp(2,new Date());
			dBAccess.setString(3,attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
			dBAccess.setString(4,((AttendanceSearchForm)attendanceForm).getMissingRemark());
			dBAccess.setLong(5,attendanceForm.getAgentDayId());
		
			dBAccess.executeUpdate();


		} catch(DBUpdateNoRowsException e){
			sql=new StringBuffer();
			sql.append("INSERT INTO SHIFTER.shf_attendance(");
			sql.append("SHF_EMPLOYEE_DAY_ID,");
			sql.append("MISS_REASON_ID,");
			sql.append("MISSING_TIME,");
			sql.append("STAGE_ARRIVAL_USER,");
			sql.append("MISSING_REMARK) VALUES(?,?,?,?,?)");

			try {
				dBAccess.prepareStatement(sql.toString());
				dBAccess.setLong(1,attendanceForm.getAgentDayId());
				dBAccess.setInt(2,((AttendanceSearchForm)attendanceForm).getMissingReasonId());
				dBAccess.setTimestamp(3,new Date());
				dBAccess.setString(4,attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
				dBAccess.setString(5,((AttendanceSearchForm)attendanceForm).getMissingRemark());
				dBAccess.executeUpdate();


			} catch (DBException e2) {
				logger.error("error in updateMissing() while inserting record : " + e2.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		} catch (DBException e) {
			logger.error("error in updateMissing() while updating record : " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in updateMissing() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	/**
	 * 
	 */
	public void setFormDefaults() throws ShfException {
		logger.debug("Starting setFormDefaults()");
		Calendar cal=Calendar.getInstance();
		if(cal.get(Calendar.MINUTE)>10)
			cal.add(Calendar.HOUR_OF_DAY,1);
		int h=cal.get(Calendar.HOUR_OF_DAY);
		if(attendanceForm.getAllowedMoked()!=null){
			((AttendanceSearchForm)attendanceForm).setMoked(attendanceForm.getAllowedMoked());
			String[] arr={"00"};
			((AttendanceSearchForm)attendanceForm).setActivity(arr);
		}
		((AttendanceSearchForm)attendanceForm).setTimeFrom(h+":00");
		((AttendanceSearchForm)attendanceForm).setTimeTo(h+":00");
		((AttendanceSearchForm)attendanceForm).setAttendanceDate(new Date());
		((AttendanceSearchForm)attendanceForm).setJob("00");
	}

	/**
	 * 
	 */

	public Vector populateAttendanceList() throws ShfException {
		logger.debug("beginning of populateAttendanceList.");
		int param_index=1;
		StringBuffer sSql=new StringBuffer();
		
	   	sSql.append("(SELECT ");
	   	sSql.append("D.*, ");
//	   	sSql.append("D.REMARK, ");
//	   	sSql.append("D.SOURCE, ");
//	   	sSql.append("D.WM_DATE, ");
//	   	sSql.append("D.WM_SCH_STATE_DATA, "); 
//	   	sSql.append("D.WM_SCHEDULE_DAY_ID, ");
//	   	sSql.append("D.WM_SHIFT_ID, ");
//	   	sSql.append("D.WM_TIMEOFF_TYPE_ID, ");
//		sSql.append("D.WM_SCH_ACTIVITY_ID_DATA , ");
//		sSql.append("D.WM_END_DATETIME  , ");
//		sSql.append("D.WM_START_DATETIME, ");
//		sSql.append("D.WM_DAY_TYPE, ");
//		sSql.append("D.EMP_ID_NUMBER, ");
//	    sSql.append("D.WM_EXCEPTION_TYPE_ID, "); 
//	    sSql.append("D.WM_WORK_MINUTES, ");
//	    sSql.append("D.WM_SHIFT_END_DATETIME, "); 
//	    sSql.append("D.WM_SHIFT_START_DATETIME AS WM_SHIFT_START_DATETIME, "); 
//	    sSql.append("D.WM_SITE_ID, ");
//	    sSql.append("D.WM_TIMEOFF_TYPE_ID, "); 
//	   	sSql.append("D.WM_WORK_MINUTES, ");
//	   	sSql.append("D.SHF_EMPLOYEE_DAY_ID, ");
	   	sSql.append("NULL AS NEW_ACTIVITY, "); 
	   	sSql.append("NULL AS NEW_DAY_END, "); 
	   	sSql.append("NULL AS NEW_DAY_START, "); 
	   	sSql.append("NULL AS NEW_DAY_TYPE, "); 
	   	sSql.append("NULL AS NEW_EMPLOYEE_ID, "); 
	   	sSql.append("NULL AS NEW_EXCEPTION_TYPE_ID, "); 
	   	sSql.append("NULL AS NEW_PAID_MINUTES, "); 
	   	sSql.append("NULL AS NEW_SHIFT_END, "); 
	   	sSql.append("NULL AS NEW_SHIFT_START, "); 
	   	sSql.append("NULL AS NEW_SITE_ID, ");
	   	sSql.append("NULL AS NEW_TIMEOFF_TYPE_ID, "); 
	   	sSql.append("NULL AS NEW_WORK_MINUTES , ");
	   	//sSql.append("NULL AS SHF_EMPLOYEE_DAY_ID, ");
	   	sSql.append("NULL AS START_CHANGE_REASON, "); 
	   	sSql.append("NULL AS END_CHANGE_REASON, "); 
	   	sSql.append("NULL AS SWITCH_DAY_ID, ");
	   	sSql.append("NULL AS MODIFICATION_TIME, "); 
	   	sSql.append("NULL AS MODIFICATION_USER, "); 
	   	sSql.append("NULL AS NEW_WORK_FROM_HOME, ");
	   	sSql.append("NULL AS NEW_SPLIT_SHIFT, ");
	   	sSql.append("NULL AS NEW_SPLIT_START, ");
	   	sSql.append("NULL AS NEW_SPLIT_END, ");
	   	sSql.append("A.STAGE_ARRIVAL_TIME , ");
	   	sSql.append("A.STATION_ARRIVAL_TIME , ");
	   	sSql.append("A.STAGE_ARRIVAL_USER , ");
	   	sSql.append("A.STATION_ARRIVAL_USER , ");
	   	sSql.append("A.LATE_MINUTES , ");
	   	sSql.append("A.LATE_REASON_ID , ");
	   	sSql.append("A.MISS_REASON_ID ,");
	   	sSql.append("A.MISSING_TIME , ");
	   	sSql.append("A.MISSING_REMARK , ");
	   	sSql.append("A.LATE_REMARK , ");
	   	sSql.append("A.STATION_EXIT_TIME, "); 
	   	sSql.append("A.STATION_EXIT_USER, ");
	   	sSql.append("a.STAGE_LATE_MINUTES , ");
		sSql.append("a.STAGE_LATE_REASON_ID , ");
		sSql.append("a.STAGE_LATE_REMARK , ");
		sSql.append("a.OPTIONAL1 , ");
		sSql.append("a.TADREECH , ");	
	   	sSql.append("E.EMPLOYEE_ID, E.LAST_NAME, E.FIRST_NAME, E.INNER_JOB_ID, E.JOB_ID, E.ORG_UNIT_ID, "); 
	   	sSql.append("E.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, E.LAST_NAME AS LAST_NAME_OLD, E.FIRST_NAME AS FIRST_NAME_OLD, ");
	   	
	   	sSql.append(" l.applier_name, ");
		sSql.append(" l.updater_name, ");
		sSql.append(" l.cancel_login_remark ");
	   	
	   	sSql.append("FROM SHIFTER.SHF_EMPLOYEES E,  ");
	   	sSql.append("SHIFTER.SHF_ORG_UNIT U , SHIFTER.SHF_EMPLOYEE_DAY D LEFT JOIN SHIFTER.SHF_ATTENDANCE A ON D.SHF_EMPLOYEE_DAY_ID=A.SHF_EMPLOYEE_DAY_ID ");
	   	sSql.append("left join SHIFTER.Shf_Cti_Cancel_Login_Shifts l on d.shf_employee_day_id=l.shf_employee_day_id ");
	   	sSql.append("WHERE E.EMPLOYEE_ID IS NOT NULL ");
	   	sSql.append("AND SUBSTR(E.EMP_ID_NUMBER,1,8) = D.EMP_ID_NUMBER ");
//	   	sSql.append("AND D.SHF_EMPLOYEE_DAY_ID=A.SHF_EMPLOYEE_DAY_ID ");
	   	sSql.append("AND U.ORG_UNIT_ID = E.ORG_UNIT_ID ");
	   	sSql.append("AND D.WM_DAY_TYPE =? "); 	// 1
//	   	sSql.append("AND D.WM_SHIFT_START_DATETIME BETWEEN ? AND ? "); // 2, 3 / Igal split shift 5.2018 ORIGINAL
	   	sSql.append("AND (D.WM_SHIFT_START_DATETIME BETWEEN ? AND ? OR D.SPLIT_END BETWEEN ? AND ?) "); // 2, 3, 4, 5 / Igal split shift 5.2018
	   	sSql.append("AND D.SHF_EMPLOYEE_DAY_ID IN ");
	   	sSql.append("(SELECT D.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY D  MINUS SELECT C.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_DAY_CHANGES C) ");
	   	
		if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
			if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
				sSql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = ((AttendanceSearchForm)attendanceForm).getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) "); // 6, 7
			}
		}else{
			sSql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=attendanceForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		// Svetlana
		/*if( ((AttendanceSearchForm)attendanceForm).getActivity()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getActivity()[0]))){
			sSql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = ((AttendanceSearchForm)attendanceForm).getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")"); 
		}*/
		
		if( ((AttendanceSearchForm)attendanceForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((AttendanceSearchForm)attendanceForm).getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(") ");
		}
	   	
		if (((AttendanceSearchForm)attendanceForm).getWorkLocation() != null && !"00".equals(((AttendanceSearchForm)attendanceForm).getWorkLocation()[0])) {
			sSql.append("AND d.WORK_FROM_HOME in (");
			List<String> list = Arrays.asList(((AttendanceSearchForm)attendanceForm).getWorkLocation());
			
			if (list.contains(SHFConstants.SHIFT_LOCATION_HOME)) {
				sSql.append("'Y'");
			}
			if (list.size() > 1) {
				sSql.append(",");
			}			
			if (list.contains("site")) {
				sSql.append("'N'");
			}
			sSql.append(") ");			
		}
		
	   	sSql.append(") ");  //end for select - 1
	   	sSql.append("UNION ");
	   	sSql.append("(SELECT ");
	    sSql.append("D.*, ");
//	   	sSql.append("D.REMARK, ");
//	   	sSql.append("D.SOURCE, ");
//	   	sSql.append("D.WM_DATE, ");
//	   	sSql.append("D.WM_SCH_STATE_DATA, "); 
//	   	sSql.append("D.WM_SCHEDULE_DAY_ID, ");
//	   	sSql.append("D.WM_SHIFT_ID, ");
//	   	sSql.append("D.WM_TIMEOFF_TYPE_ID, ");
//	    sSql.append("C.*, "); 
	   	sSql.append("C.NEW_ACTIVITY, "); 
	   	sSql.append("C.NEW_DAY_END, "); 
	   	sSql.append("C.NEW_DAY_START, "); 
	   	sSql.append("C.NEW_DAY_TYPE, "); 
	   	sSql.append("C.NEW_EMPLOYEE_ID, "); 
	   	sSql.append("C.NEW_EXCEPTION_TYPE_ID, "); 
	   	sSql.append("C.NEW_PAID_MINUTES, "); 
	   	sSql.append("C.NEW_SHIFT_END, "); 
	   	sSql.append("C.NEW_SHIFT_START, "); 
	   	sSql.append("C.NEW_SITE_ID, ");
	   	sSql.append("C.NEW_TIMEOFF_TYPE_ID, "); 
	   	sSql.append("C.NEW_WORK_MINUTES , ");
//	   	sSql.append("C.SHF_EMPLOYEE_DAY_ID, ");
	   	sSql.append("C.START_CHANGE_REASON, ");
	   	sSql.append("C.END_CHANGE_REASON, ");
	   	sSql.append("C.SWITCH_DAY_ID, ");
	   	sSql.append("C.MODIFICATION_TIME, ");
	   	sSql.append("C.MODIFICATION_USER, ");
	   	sSql.append("C.NEW_WORK_FROM_HOME, ");
	   	sSql.append("C.NEW_SPLIT_SHIFT, ");
	   	sSql.append("C.NEW_SPLIT_START, ");
	   	sSql.append("C.NEW_SPLIT_END, ");
	   	sSql.append("A.STAGE_ARRIVAL_TIME , ");
	   	sSql.append("A.STATION_ARRIVAL_TIME , ");
	   	sSql.append("A.STAGE_ARRIVAL_USER , ");
	   	sSql.append("A.STATION_ARRIVAL_USER , ");
	   	sSql.append("A.LATE_MINUTES , ");
	   	sSql.append("A.LATE_REASON_ID , ");
	   	sSql.append("A.MISS_REASON_ID , ");
	   	sSql.append("A.MISSING_TIME , ");
	   	sSql.append("A.MISSING_REMARK , ");
	   	sSql.append("A.LATE_REMARK , ");
	   	sSql.append("A.STATION_EXIT_TIME, "); 
	   	sSql.append("A.STATION_EXIT_USER, ");
	   	sSql.append("a.STAGE_LATE_MINUTES , ");
		sSql.append("a.STAGE_LATE_REASON_ID , ");
		sSql.append("a.STAGE_LATE_REMARK , ");
		sSql.append("a.OPTIONAL1 , ");
		sSql.append("a.TADREECH , ");	   	
//	   	sSql.append("A.*, ");
	   	sSql.append("E.EMPLOYEE_ID, E.LAST_NAME, E.FIRST_NAME, E.INNER_JOB_ID, E.JOB_ID, E.ORG_UNIT_ID, E_OLD.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, "); 
	   	sSql.append("E_OLD.LAST_NAME AS LAST_NAME_OLD, E_OLD.FIRST_NAME AS FIRST_NAME_OLD, ");
	   	
	   	sSql.append(" l.applier_name, ");
		sSql.append(" l.updater_name, ");
		sSql.append(" l.cancel_login_remark ");
	   	
	   	sSql.append("FROM SHIFTER.SHF_EMPLOYEES E, SHIFTER.SHF_EMPLOYEES E_OLD , SHIFTER.SHF_ORG_UNIT U, SHIFTER.SHF_EMPLOYEE_DAY D, SHIFTER.SHF_DAY_CHANGES C ");
	   	sSql.append("LEFT JOIN SHIFTER.SHF_ATTENDANCE A ON C.SHF_EMPLOYEE_DAY_ID=A.SHF_EMPLOYEE_DAY_ID ");
	   	sSql.append("left join SHIFTER.Shf_Cti_Cancel_Login_Shifts l on C.shf_employee_day_id=l.shf_employee_day_id ");
	   	sSql.append("WHERE E.EMPLOYEE_ID IS NOT NULL ");
	   	sSql.append("AND D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
	   	sSql.append("AND SUBSTR(E.EMP_ID_NUMBER,1,8) = C.NEW_EMPLOYEE_ID ");
	   	sSql.append("AND SUBSTR(E_OLD.EMP_ID_NUMBER,1,8) = D.EMP_ID_NUMBER ");
	   	sSql.append("AND U.ORG_UNIT_ID = E.ORG_UNIT_ID ");
	   	sSql.append("AND C.NEW_DAY_TYPE = ? "); // 8
//	   	sSql.append("AND C.NEW_SHIFT_START BETWEEN ?  AND ? "); // 7, 8 / Igal split shift ORIGINAL
	   	sSql.append("AND (C.NEW_SHIFT_START BETWEEN ? AND ? OR C.NEW_SPLIT_END BETWEEN ? AND ?) "); // 9, 10, 11, 12 / Igal split shift 5.2018

		if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
			if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
				sSql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = ((AttendanceSearchForm)attendanceForm).getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) "); // 13, 14
			}
		}else{
			sSql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=attendanceForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		// Svetlana
		/*if( ((AttendanceSearchForm)attendanceForm).getActivity()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getActivity()[0]))){
			sSql.append("AND replace(c.NEW_ACTIVITY,';','') in ( ");
			String[] array = ((AttendanceSearchForm)attendanceForm).getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}*/
		
		if( ((AttendanceSearchForm)attendanceForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((AttendanceSearchForm)attendanceForm).getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		if (((AttendanceSearchForm)attendanceForm).getWorkLocation() != null && !"00".equals(((AttendanceSearchForm)attendanceForm).getWorkLocation()[0])) {
			sSql.append("AND c.NEW_WORK_FROM_HOME in (");
			List<String> list = Arrays.asList(((AttendanceSearchForm)attendanceForm).getWorkLocation());
			
			if (list.contains(SHFConstants.SHIFT_LOCATION_HOME)) {
				sSql.append("'Y'");
			}
			if (list.size() > 1) {
				sSql.append(",");
			}			
			if (list.contains("site")) {
				sSql.append("'N'");
			}
			sSql.append(") ");			
		}
		
		
	   	sSql.append(") "); // end select - 2
//		sSql.append(" ORDER BY wm_shift_start_datetime,FIRST_NAME,LAST_NAME");
		
		
		String dayDate=BaseConvert.dateToString(((AttendanceSearchForm)attendanceForm).getAttendanceDate(),"dd/MM/yyyy");
		String timeFrom=dayDate+" "+((AttendanceSearchForm)attendanceForm).getTimeFrom()+":00";
		String timeTo=dayDate+" "+((AttendanceSearchForm)attendanceForm).getTimeTo()+":00";
		Date timeFromDate=null,timeToDate=null;
		try{
			timeFromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
			timeToDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			logger.error("error in populateAttendanceList() while converting string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
					
		int lateSum = 0;
		int missSum = 0;
		int stageSum = 0;
		int stationSum = 0;
		int tadreech = 0;
		int inforceSum = 0;
		int slpitSum = 0;
		int netHoursSum = 0;
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			
// parameter for select - 1 :			
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY); // 1
			dBAccess.setTimestamp(param_index++,timeFromDate);	// 2
			dBAccess.setTimestamp(param_index++,timeToDate); // 3
			dBAccess.setTimestamp(param_index++,timeFromDate);	// 4
			dBAccess.setTimestamp(param_index++,timeToDate); // 5
			if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
				if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
				}
				else{
					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked()); // 6
					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked()); // 7
				}
				
			}
 //parameters for select - 2 :
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY); // 8
			dBAccess.setTimestamp(param_index++,timeFromDate);	// 9
			dBAccess.setTimestamp(param_index++,timeToDate); // 10
			dBAccess.setTimestamp(param_index++,timeFromDate);	// 11
			dBAccess.setTimestamp(param_index++,timeToDate); // 12
			if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
				if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
				}
				else{
					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked()); // 13
					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked()); // 14
				}
				
			}
			dBAccess.executeQuery();
			Vector<AgentDayBean> attlist = new Vector<AgentDayBean>();
			AgentDayBean dayInfo=null;
			while(dBAccess.next()){
				dayInfo = new AgentDayBean();
				dBAccess.populate(dayInfo);
				attlist.add(dayInfo);
				SHFUtils.getLengthFormat(dayInfo.getShiftLengthChange());
				if(dayInfo.getMissingReasonId()>0) missSum++;
				if(dayInfo.getLateMinutes()>0) lateSum++;
				if(dayInfo.getStageArrivalTime()!=null) stageSum++;
				if(dayInfo.getStationArrivalTime()!=null) stationSum++;
				if(dayInfo.getTadreech()==1) tadreech++;
				if("fExtra".equals(dayInfo.getShiftSource())) inforceSum++;
				if(dayInfo.isShiftSplit()) slpitSum++;
				if(dayInfo.getShiftLengthChange() != 0) netHoursSum += dayInfo.getShiftLengthChange();
			}

			if(!attlist.isEmpty()){
				((AttendanceSearchForm)attendanceForm).setAttendSum(stageSum);
				((AttendanceSearchForm)attendanceForm).setStationSum(stationSum);
				((AttendanceSearchForm)attendanceForm).setLateSum(lateSum);
				((AttendanceSearchForm)attendanceForm).setMissingSum(missSum);
				((AttendanceSearchForm)attendanceForm).setTadreechSum(tadreech);
				((AttendanceSearchForm)attendanceForm).setInforceSum(inforceSum);
				((AttendanceSearchForm)attendanceForm).setSlpitSum(slpitSum);
				((AttendanceSearchForm)attendanceForm).setNetHoursSum(netHoursSum);
				
				String t = SHFUtils.getLengthFormat(netHoursSum);
			}
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateAttendanceList() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sSql=null;
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateAttendanceList() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
	
	
//	public Vector populateAttendanceList() throws ShfException {
//		logger.debug("beginning of populateAttendanceList.");
//		int param_index=1;
//		StringBuffer sSql=new StringBuffer();
//		
//		sSql.append("select d.*, ");
//		sSql.append("c.NEW_ACTIVITY, ");
//		sSql.append("c.NEW_DAY_END, ");
//		sSql.append("c.NEW_DAY_START, ");
//		sSql.append("c.NEW_DAY_TYPE, ");
//		sSql.append("c.NEW_EMPLOYEE_ID, ");
//		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
//		sSql.append("c.NEW_PAID_MINUTES, ");
//		sSql.append("c.NEW_SHIFT_END, ");
//		sSql.append("c.NEW_SHIFT_START, ");
//		sSql.append("c.NEW_SITE_ID, ");
//		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
//		sSql.append("c.NEW_WORK_MINUTES, ");
//		sSql.append("c.START_CHANGE_REASON, ");
//		sSql.append("c.END_CHANGE_REASON, ");
//		sSql.append("c.SWITCH_DAY_ID, ");
//		sSql.append("c.MODIFICATION_TIME, ");
//		sSql.append("c.MODIFICATION_USER, ");
//		
//		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
//		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
//		sSql.append("a.STAGE_ARRIVAL_USER , ");
//		sSql.append("a.STATION_ARRIVAL_USER ,  ");
//		sSql.append("a.LATE_MINUTES , ");
//		sSql.append("a.LATE_REASON_ID , ");
//		sSql.append("a.MISS_REASON_ID , ");
//		sSql.append("a.MISSING_TIME , ");
//		sSql.append("a.MISSING_REMARK , ");
//		sSql.append("a.LATE_REMARK , ");
//		sSql.append("a.STATION_EXIT_TIME, ");
//		sSql.append("a.STATION_EXIT_USER, ");
//		sSql.append("a.STAGE_LATE_MINUTES , ");
//		sSql.append("a.STAGE_LATE_REASON_ID , ");
//		sSql.append("a.STAGE_LATE_REMARK , ");
//		sSql.append("a.OPTIONAL1 , ");
//		sSql.append("a.TADREECH , ");
//		
//		sSql.append("e.EMPLOYEE_ID, ");
//		sSql.append("e.LAST_NAME, ");
//		sSql.append("e.FIRST_NAME, ");
//		sSql.append("e.JOB_ID, ");
//		sSql.append("e.ORG_UNIT_ID, ");
//		
//		sSql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
//		sSql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
//		sSql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");		
//		
//		sSql.append("from SHIFTER.shf_employee_day d ");
//		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
//		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
//		sSql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
//		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
//		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
//		sSql.append("where e.employee_id is not null AND c.CANCEL_REASON_CODE is null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=?  ");
//		
//		sSql.append("and NVL(c.NEW_SHIFT_START,d.wm_shift_start_datetime) between ? and ? ");
//		
//		if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
//			if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
//				sSql.append("AND e.ORG_UNIT_ID in( ");
//				String[] array = ((AttendanceSearchForm)attendanceForm).getTeam();
//				for(int i=0;i<array.length;i++){
//					sSql.append(array[i]);
//					if(i<array.length-1) sSql.append(",");
//				}
//				sSql.append(") ");
//			}
//			else{
//				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
//			}
//		}else{
//			sSql.append("AND u.PARENT_UNIT IN (");
//			Vector allowed=attendanceForm.getAllowedUnits();
//			for(int i=0;i<allowed.size();i++){
//				sSql.append((String)allowed.get(i));
//				if(i<allowed.size()-1) sSql.append(",");
//			}
//			sSql.append(") ");
//		}
//		if( ((AttendanceSearchForm)attendanceForm).getActivity()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getActivity()[0]))){
//			sSql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
//			String[] array = ((AttendanceSearchForm)attendanceForm).getActivity();
//			for(int i=0;i<array.length;i++){
//				sSql.append(array[i]);
//				if(i<array.length-1) sSql.append(",");
//			}
//			sSql.append(")");
//		}
//		
//		if( ((AttendanceSearchForm)attendanceForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getInnerJob()[0]))){
//			sSql.append("AND e.INNER_JOB_ID in (");
//			String[] array = ((AttendanceSearchForm)attendanceForm).getInnerJob();
//			for(int i=0;i<array.length;i++){
//				sSql.append(array[i]);
//				if(i<array.length-1) sSql.append(",");
//			}
//			sSql.append(")");
//		}
//		sSql.append(" ORDER BY d.wm_shift_start_datetime,e.FIRST_NAME,e.LAST_NAME");
//		
//		
//		String dayDate=BaseConvert.dateToString(((AttendanceSearchForm)attendanceForm).getAttendanceDate(),"dd/MM/yyyy");
//		String timeFrom=dayDate+" "+((AttendanceSearchForm)attendanceForm).getTimeFrom()+":00";
//		String timeTo=dayDate+" "+((AttendanceSearchForm)attendanceForm).getTimeTo()+":00";
//		Date timeFromDate=null,timeToDate=null;
//		try{
//			timeFromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
//			timeToDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
//		}catch(ConvertException e){
//			logger.error("error in populateAttendanceList() while converting string to date: "+e.getMessage());
//			ActionErrors actionErrors=new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
//			throw new ShfException(actionErrors);
//		}
//					
//		int lateSum=0;
//		int missSum=0;
//		int stageSum=0;
//		int stationSum=0;
//		int tadreech=0;
//		DBAccess dBAccess=null;
//		try {
//			dBAccess=new DBAccess();
//			dBAccess.prepareStatement(sSql.toString());
//			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
//			dBAccess.setTimestamp(param_index++,timeFromDate);	
//			dBAccess.setTimestamp(param_index++,timeToDate);
//	
//			if(((AttendanceSearchForm)attendanceForm).getMoked()!=null && !((AttendanceSearchForm)attendanceForm).getMoked().equals("-1")){
//				if(((AttendanceSearchForm)attendanceForm).getTeam()!=null && !((AttendanceSearchForm)attendanceForm).getTeam()[0].equals("00")){
//					//dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getTeam());	
//				}
//				else{
//					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked());
//					dBAccess.setString(param_index++,((AttendanceSearchForm)attendanceForm).getMoked());
//				}
//				
//			}
//			/*if( ((AttendanceSearchForm)attendanceForm).getActivity()!=null && (!"00".equals(((AttendanceSearchForm)attendanceForm).getActivity()[0]))){
//				dBAccess.setString(param_index,((AttendanceSearchForm)attendanceForm).getActivity()[0]);	
//				param_index++;
//			}*/
//				
//			dBAccess.executeQuery();
//			Vector attlist=new Vector();
//			AgentDayBean dayInfo=null;
//			while(dBAccess.next()){
//				dayInfo=new AgentDayBean();
//				dBAccess.populate(dayInfo);
//				attlist.add(dayInfo);
//				if(dayInfo.getMissingReasonId()>0) missSum++;
//				if(dayInfo.getLateMinutes()>0) lateSum++;
//				if(dayInfo.getStageArrivalTime()!=null) stageSum++;
//				if(dayInfo.getStationArrivalTime()!=null) stationSum++;
//				if(dayInfo.getTadreech()==1) tadreech++;
//			}
//			
//			if(!attlist.isEmpty()){
//				((AttendanceSearchForm)attendanceForm).setAttendSum(stageSum);
//				((AttendanceSearchForm)attendanceForm).setStationSum(stationSum);
//				((AttendanceSearchForm)attendanceForm).setLateSum(lateSum);
//				((AttendanceSearchForm)attendanceForm).setMissingSum(missSum);
//				((AttendanceSearchForm)attendanceForm).setTadreechSum(tadreech);
//			}
//			return attlist;
//		} catch(DBQueryNoRowsException e){
//	
//		} catch (DBException e) {
//			logger.error("error in populateAttendanceList() : " + e.getMessage());
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
//			throw new ShfException(actionErrors);
//		} finally{
//			try {
//				sSql=null;
//				dBAccess.close();
//			} catch (DBException e) {
//				logger.error("error in populateAttendanceList() while closing db connection",e);
//				ActionErrors actionErrors=new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
//				throw new ShfException(actionErrors);
//			}
//		}
//		return null;
//	}
	

	public void addLate() throws ShfException{
		logger.debug("LateModel: beginning of add late.");
		int ind=1;

		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_ATTENDANCE ");
		sql.append("SET LATE_REASON_ID=? , ");
		sql.append("LATE_MINUTES = ? , ");
		sql.append("LATE_REMARK = ? ");
		sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ?");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(ind++,((AttendanceSearchForm)attendanceForm).getLateReasonId());
			dBAccess.setInt(ind++,((AttendanceSearchForm)attendanceForm).getLateMinutes());
			dBAccess.setString(ind++,((AttendanceSearchForm)attendanceForm).getLateRemark());
			dBAccess.setLong(ind++,attendanceForm.getAgentDayId());
	
			dBAccess.executeUpdate();


		} catch(DBUpdateNoRowsException e){
			logger.debug("LateModel: day "+attendanceForm.getAgentDayId()+" not exist, inserting new record .");
			sql=new StringBuffer();
			sql.append("INSERT INTO SHIFTER.shf_attendance(");
			sql.append("SHF_EMPLOYEE_DAY_ID,");
			sql.append("LATE_REASON_ID,");
			sql.append("LATE_MINUTES,");
			sql.append("STATION_ARRIVAL_USER,");
			sql.append("STATION_ARRIVAL_TIME,");
			sql.append("LATE_REMARK) VALUES(?,?,?,?,?,?)");
			try {
				dBAccess.prepareStatement(sql.toString());
				dBAccess.setLong(1,attendanceForm.getAgentDayId());
				dBAccess.setInt(2,((AttendanceSearchForm)attendanceForm).getLateReasonId());
				dBAccess.setInt(3,((AttendanceSearchForm)attendanceForm).getLateMinutes());
				dBAccess.setString(4,attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
				dBAccess.setTimestamp(5,new Date());
				dBAccess.setString(6,((AttendanceSearchForm)attendanceForm).getLateRemark());
				dBAccess.executeUpdate();
			} catch (DBException e2) {
				logger.error("error in addLate() while inserting record " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			} 
		} catch(DBException e) {
			logger.error("error in addLate() while updating record " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in addLate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void addStageLate() throws ShfException{
		logger.debug("LateModel: beginning of add stage late.");
		int ind=1;
		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_ATTENDANCE ");
		sql.append("SET STAGE_LATE_REASON_ID=? , ");
		sql.append("STAGE_LATE_MINUTES = ? , ");
		sql.append("STAGE_LATE_REMARK = ? ");
		sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ?");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(ind++,((AttendanceSearchForm)attendanceForm).getLateReasonId());
			dBAccess.setInt(ind++,((AttendanceSearchForm)attendanceForm).getLateMinutes());
			dBAccess.setString(ind++,((AttendanceSearchForm)attendanceForm).getLateRemark());
			dBAccess.setLong(ind++,attendanceForm.getAgentDayId());

			dBAccess.executeUpdate();

		} catch(DBUpdateNoRowsException e){
			
		} catch(DBException e) {
			logger.error("error in addStageLate() " + e.getMessage());
			throw new ShfException("error on checkRegister(): "+e.getMessage());
		} finally{
			try{
				sql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in addStageLate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
		
	
	public void registerStation() throws ShfException{
		logger.debug("Starting registerStation()");
		populateAgentDay();
		boolean late=false;
		Date now=new Date();
		if(now.after(attendanceForm.getShiftStart())){
			late=true;
			attendanceForm.setLateMinutes(SHFUtils.getMinutesBetween(attendanceForm.getShiftStart(),now));
		}
		
		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		attendanceForm.getShiftStart();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET STATION_ARRIVAL_TIME = ? , STATION_ARRIVAL_USER = ?  WHERE SHF_EMPLOYEE_DAY_ID = ? " ;
			dBAccess.prepareStatement(query);
			dBAccess.setTimestamp(1,now);
			dBAccess.setString(2,userName);
			dBAccess.setLong(3,attendanceForm.getAgentDayId());
			dBAccess.executeUpdate();
			
			if(late){
				throw new ShiftLateException("");
			}
			

		} catch (DBUpdateNoRowsException e){
			String query="INSERT INTO SHIFTER.SHF_ATTENDANCE(SHF_EMPLOYEE_DAY_ID,STATION_ARRIVAL_TIME,STATION_ARRIVAL_USER) values(?,?,?)";		
			try {
				dBAccess.prepareStatement(query);
				dBAccess.setLong(1,attendanceForm.getAgentDayId());
				dBAccess.setTimestamp(2,now);
				dBAccess.setString(3,userName);
				dBAccess.executeUpdate();
				attendanceForm.setStationArrivalTime(now);
				if(late){
					throw new ShiftLateException("");
				}
			} catch(DBException e1){
				logger.error("error in registerStation in insert record : "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			} 
		} catch (DBException e) {
			logger.error("error in registerStation in update record : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			attendanceForm.setStationArrivalTime(now);
			attendanceForm.setStationArrivalUser(userName);
			try{
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in registerStation while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void undoRegisterStage() throws ShfException{
		logger.debug("Starting undoRegisterStage() dayId = "+ attendanceForm.getAgentDayId());
		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		DBAccess dBAccess=null;
		int param=1;
		try {
			dBAccess=new DBAccess();
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET STAGE_ARRIVAL_TIME = ? , STAGE_ARRIVAL_USER = ? , STAGE_LATE_REASON_ID = ? , STAGE_LATE_REMARK = ? , STAGE_LATE_MINUTES = ? , TADREECH = ? WHERE SHF_EMPLOYEE_DAY_ID = ? " ;
			dBAccess.prepareStatement(query);
			dBAccess.setTimestamp(param++,null);
			dBAccess.setString(param++,null);
			dBAccess.setInteger(param++,null);
			dBAccess.setString(param++,null);
			dBAccess.setInteger(param++,null);
			dBAccess.setInteger(param++,0);
			dBAccess.setLong(param++,attendanceForm.getAgentDayId());
			dBAccess.executeUpdate();
			
		}catch(DBUpdateNoRowsException e){
	
		} catch(DBException e){
			logger.error("error in undoRegisterStage : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in undoRegisterStage while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	
	public Vector checkReports() throws ShfException{
		StringBuffer sql=new StringBuffer();
		DBAccess db=null;
		try {
			db=new DBAccess();
			sql.append("select d.*, ");
			sql.append("c.NEW_ACTIVITY, ");
			sql.append("c.NEW_DAY_END, ");
			sql.append("c.NEW_DAY_START, ");
			sql.append("c.NEW_DAY_TYPE, ");
			sql.append("c.NEW_EMPLOYEE_ID, ");
			sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
			sql.append("c.NEW_PAID_MINUTES, ");
			sql.append("c.NEW_SHIFT_END, ");
			sql.append("c.NEW_SHIFT_START, ");
			sql.append("c.NEW_SITE_ID, ");
			sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
			sql.append("c.NEW_WORK_MINUTES, ");
			sql.append("c.START_CHANGE_REASON, ");
			sql.append("c.END_CHANGE_REASON, ");
			sql.append("c.SWITCH_DAY_ID, ");
			sql.append("c.MODIFICATION_TIME, ");
			sql.append("c.MODIFICATION_USER, ");
			
			sql.append("a.STAGE_ARRIVAL_TIME ,  ");
			sql.append("a.STATION_ARRIVAL_TIME ,  ");
			sql.append("a.STAGE_ARRIVAL_USER , ");
			sql.append("a.STATION_ARRIVAL_USER ,  ");
			sql.append("a.LATE_MINUTES , ");
			sql.append("a.LATE_REASON_ID , ");
			sql.append("a.MISS_REASON_ID , ");
			sql.append("a.MISSING_TIME , ");
			sql.append("a.MISSING_REMARK , ");
			sql.append("a.LATE_REMARK , ");
			sql.append("a.STATION_EXIT_TIME, ");
			sql.append("a.STATION_EXIT_USER, ");
			sql.append("a.STAGE_LATE_MINUTES , ");
			sql.append("a.STAGE_LATE_REASON_ID , ");
			sql.append("a.STAGE_LATE_REMARK , ");
			sql.append("a.OPTIONAL1 , ");
			
			sql.append("e.EMPLOYEE_ID, ");
			sql.append("e.LAST_NAME, ");
			sql.append("e.FIRST_NAME, ");
			sql.append("e.JOB_ID, ");
			sql.append("e.ORG_UNIT_ID ");
			
			sql.append("from SHIFTER.shf_employee_reports r ");
			sql.append("left join SHIFTER.shf_employee_day d on r.shf_employee_day_id=d.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
			sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
			sql.append("WHERE r.employee_id=? and r.approved_time is null ");
			
			db.prepareStatement(sql.toString());
			db.setInt(1,attendanceForm.getEmployeeId());
			db.executeQuery();
			Vector vec=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean",vec);
			return vec;
		}catch (DBQueryNoRowsException e){
			
		}catch (DBException e){
			logger.error("error in checkReports : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				sql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error in checkReports while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
	
	public void registerStage() throws ShfException{
		logger.debug("Starting registerStage()");
		populateAgentDay();
		Date shiftStart=attendanceForm.getShiftStart();
		boolean late=false;
		String moked=SHFTableUtils.getMokedCodeOf(attendanceForm.getOrgUnitCode());
		int minMinutes=Integer.parseInt(SHFParameters.getMinutesBeforeLateParam(moked).getValue());
		Date now=new Date();
		Calendar cal=Calendar.getInstance();
		cal.setTime(now);
		cal.add(Calendar.MINUTE,minMinutes);
		if(cal.getTime().after(shiftStart)){
			late=true;
			attendanceForm.setLateMinutes(SHFUtils.getMinutesBetween(shiftStart,cal.getTime()));
		}

		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		DBAccess dBAccess=null;
		int param=1;
		try {
			dBAccess=new DBAccess();
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET STAGE_ARRIVAL_TIME = ? , STAGE_ARRIVAL_USER = ? , TADREECH = ? WHERE SHF_EMPLOYEE_DAY_ID = ? " ;
			dBAccess.prepareStatement(query);
			dBAccess.setTimestamp(param++,now);
			dBAccess.setString(param++,userName);
			dBAccess.setInt(param++, ((EmployeeArriveForm)attendanceForm).getTadreech());
			dBAccess.setLong(param++,attendanceForm.getAgentDayId());
			dBAccess.executeUpdate();
			if(late){
				throw new ShiftLateException("");
			}
		}catch(DBUpdateNoRowsException e){
			String query="INSERT INTO SHIFTER.SHF_ATTENDANCE(SHF_EMPLOYEE_DAY_ID,STAGE_ARRIVAL_TIME,STAGE_ARRIVAL_USER,TADREECH) values(?,?,?,?)";
			param=1;
			try {
				dBAccess.prepareStatement(query);
				dBAccess.setLong(param++,attendanceForm.getAgentDayId());
				dBAccess.setTimestamp(param++,now);
				dBAccess.setString(param++,userName);
				dBAccess.setInt(param++, ((EmployeeArriveForm)attendanceForm).getTadreech());
				dBAccess.executeUpdate();
				if(late){
					throw new ShiftLateException("");
				}
			} catch (DBException e1) {
				logger.error("error in registerStage insert record : "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
			
		} catch(DBException e){
			logger.error("error in registerStage update record: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in registerStage while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public Vector getAgentDayExceptions(long agentDayId,int exceptionType) throws ShfException{
		logger.debug("Starting getAgentDayExceptions() dayId = " + agentDayId);
		Vector breaks=new Vector();

		String sql="select * from SHIFTER.shf_employee_exceptions t where t.state_type=? and t.agent_day_id=? order by t.start_time";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInt(1,exceptionType);
			db.setLong(2,agentDayId);
			db.executeQuery();
			BreakBean breakInfo=null;
			while(db.next()){
				breakInfo=new BreakBean();
				db.populate(breakInfo);
				breaks.add(breakInfo);
			}
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in getAgentDayExceptions : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed",null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in getAgentDayExceptions while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return breaks;
	}
	
	public void currentAgentDayFromChange() throws ShfException{
		logger.debug("Starting currentAgentDay()");

		StringBuffer sSql=new StringBuffer();
		DBAccess dBAccess=null;

		sSql.append("select d.*, ");
		
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
		
		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
		sSql.append("a.STAGE_ARRIVAL_USER , ");
		sSql.append("a.STATION_ARRIVAL_USER ,  ");
		sSql.append("a.LATE_MINUTES , ");
		sSql.append("a.LATE_REASON_ID , ");
		sSql.append("a.MISS_REASON_ID , ");
		sSql.append("a.MISSING_TIME , ");
		sSql.append("a.MISSING_REMARK , ");
		sSql.append("a.LATE_REMARK , ");
		sSql.append("a.STATION_EXIT_TIME, ");
		sSql.append("a.STATION_EXIT_USER, ");
		
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.SHF_LOCKED, ");
		sSql.append("e.ORG_UNIT_ID ");
		
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = c.new_employee_id ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append("WHERE e.emp_id_number = ? ");
		sSql.append("AND nvl(c.NEW_DAY_START,d.WM_SHIFT_START_DATETIME) -1/24 <= ? ");
		sSql.append("AND nvl(c.NEW_DAY_END,d.WM_SHIFT_END_DATETIME) + ?/1440 >= ?   ");
		
		String maxAfterEnd=SHFParameters.getMaxMinutesToExitAfterEnd(attendanceForm.getAllowedMoked()).getValue();
		
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setString(1,attendanceForm.getUserId());
			dBAccess.setTimestamp(2,new Date());
			dBAccess.setString(3,maxAfterEnd);
			dBAccess.setTimestamp(4,new Date());
			
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			} 

		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in currentAgentDay : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in currentAgentDay while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void currentAgentDayFromDay() throws ShfException{
		logger.debug("Starting currentAgentDay()");

		StringBuffer sSql=new StringBuffer();
		DBAccess dBAccess=null;
		int param=1;

//		sSql.append("select d.*, ");
//		
//		sSql.append("c.NEW_ACTIVITY, ");
//		sSql.append("c.NEW_DAY_END, ");
//		sSql.append("c.NEW_DAY_START, ");
//		sSql.append("c.NEW_DAY_TYPE, ");
//		sSql.append("c.NEW_EMPLOYEE_ID, ");
//		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
//		sSql.append("c.NEW_PAID_MINUTES, ");
//		sSql.append("c.NEW_SHIFT_END, ");
//		sSql.append("c.NEW_SHIFT_START, ");
//		sSql.append("c.NEW_SITE_ID, ");
//		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
//		sSql.append("c.NEW_WORK_MINUTES, ");
//		sSql.append("c.START_CHANGE_REASON, ");
//		sSql.append("c.END_CHANGE_REASON, ");
//		sSql.append("c.SWITCH_DAY_ID, ");
//		sSql.append("c.MODIFICATION_TIME, ");
//		sSql.append("c.MODIFICATION_USER, ");
//		
//		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
//		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
//		sSql.append("a.STAGE_ARRIVAL_USER , ");
//		sSql.append("a.STATION_ARRIVAL_USER ,  ");
//		sSql.append("a.LATE_MINUTES , ");
//		sSql.append("a.LATE_REASON_ID , ");
//		sSql.append("a.MISS_REASON_ID , ");
//		sSql.append("a.MISSING_TIME , ");
//		sSql.append("a.MISSING_REMARK , ");
//		sSql.append("a.LATE_REMARK , ");
//		sSql.append("a.STATION_EXIT_TIME, ");
//		sSql.append("a.STATION_EXIT_USER, ");
//		
//		sSql.append("e.EMPLOYEE_ID, ");
//		sSql.append("e.LAST_NAME, ");
//		sSql.append("e.FIRST_NAME, ");
//		sSql.append("e.JOB_ID, ");
//		sSql.append("e.SHF_LOCKED, ");
//		sSql.append("e.ORG_UNIT_ID ");
//		///-yuval 14022011
//		sSql.append("from SHIFTER.shf_employee_day d ");
//		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
//		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = nvl(c.new_employee_id, d.emp_id_number ) ");
//		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
//		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
//		sSql.append("WHERE e.emp_id_number = ? ");
//		sSql.append("AND nvl(c.NEW_DAY_START,d.WM_SHIFT_START_DATETIME) -1/24 <= ? ");
//		sSql.append("AND nvl(c.NEW_DAY_END,d.WM_SHIFT_END_DATETIME) + ?/1440 >= ?   ");
		
		
		sSql.append(" ( ");
		sSql.append(" select "); 
		sSql.append(" D.*,  ");
		sSql.append(" NULL AS NEW_ACTIVITY, ");  
		sSql.append(" NULL AS NEW_DAY_END, ");
		sSql.append(" NULL AS NEW_DAY_START, ");
		sSql.append(" NULL AS NEW_DAY_TYPE, ");
		sSql.append(" NULL AS NEW_EMPLOYEE_ID, ");
		sSql.append(" NULL AS NEW_EXCEPTION_TYPE_ID, ");
		sSql.append(" NULL AS NEW_PAID_MINUTES, ");
		sSql.append(" NULL AS NEW_SHIFT_END, ");
		sSql.append(" NULL AS NEW_SHIFT_START, ");
		sSql.append(" NULL AS NEW_SITE_ID, ");
		sSql.append(" NULL AS NEW_TIMEOFF_TYPE_ID, ");
		sSql.append(" NULL AS NEW_WORK_MINUTES , ");
		sSql.append(" NULL AS START_CHANGE_REASON, ");
		sSql.append(" NULL AS END_CHANGE_REASON, ");
		sSql.append(" NULL AS SWITCH_DAY_ID, ");
		sSql.append(" NULL AS MODIFICATION_TIME, ");
		sSql.append(" NULL AS MODIFICATION_USER, ");
		sSql.append(" a.STAGE_ARRIVAL_TIME,  a.STATION_ARRIVAL_TIME,  a.STAGE_ARRIVAL_USER, a.STATION_ARRIVAL_USER, ");
		sSql.append(" a.LATE_MINUTES, a.LATE_REASON_ID, a.MISS_REASON_ID, a.MISSING_TIME, a.MISSING_REMARK, ");
		sSql.append(" a.LATE_REMARK, a.STATION_EXIT_TIME, a.STATION_EXIT_USER, a.STAGE_LATE_MINUTES, ");
		sSql.append(" a.STAGE_LATE_REASON_ID, a.STAGE_LATE_REMARK, ");
		sSql.append(" e.EMPLOYEE_ID, e.LAST_NAME, e.FIRST_NAME, e.JOB_ID, e.SHF_LOCKED, e.ORG_UNIT_ID ");
		sSql.append(" from SHIFTER.shf_employee_day d ");
		sSql.append(" left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sSql.append(" left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append(" left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append(" WHERE e.emp_id_number = ?  ");
		sSql.append(" AND d.WM_SHIFT_START_DATETIME -1/24 <= ?  ");
		sSql.append(" AND d.WM_SHIFT_END_DATETIME + ?/1440 >= ? ");   
		sSql.append(" and d.shf_employee_day_id  in ");
		sSql.append(" (select d.shf_employee_day_id from SHIFTER.shf_employee_day d  minus select c.shf_employee_day_id ");
		sSql.append(" from shifter.shf_day_changes c) ");
		sSql.append(" ) ");
		sSql.append(" UNION ALL ");
		sSql.append(" ( ");
		sSql.append(" select "); 
		sSql.append(" D.*, ");
		sSql.append(" C.NEW_ACTIVITY, ");
		sSql.append(" C.NEW_DAY_END, ");
		sSql.append(" C.NEW_DAY_START, ");
		sSql.append(" C.NEW_DAY_TYPE, ");
		sSql.append(" C.NEW_EMPLOYEE_ID, ");
		sSql.append(" C.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append(" C.NEW_PAID_MINUTES, ");
		sSql.append(" C.NEW_SHIFT_END, ");
		sSql.append(" C.NEW_SHIFT_START, ");
		sSql.append(" C.NEW_SITE_ID, ");
		sSql.append(" C.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append(" C.NEW_WORK_MINUTES , ");
		sSql.append(" C.START_CHANGE_REASON, ");
		sSql.append(" C.END_CHANGE_REASON, ");
		sSql.append(" C.SWITCH_DAY_ID, ");
		sSql.append(" C.MODIFICATION_TIME, ");
		sSql.append(" C.MODIFICATION_USER, ");
		sSql.append(" a.STAGE_ARRIVAL_TIME,  a.STATION_ARRIVAL_TIME,  a.STAGE_ARRIVAL_USER, a.STATION_ARRIVAL_USER, ");
		sSql.append(" a.LATE_MINUTES, a.LATE_REASON_ID, a.MISS_REASON_ID, a.MISSING_TIME, a.MISSING_REMARK, ");
		sSql.append(" a.LATE_REMARK, a.STATION_EXIT_TIME, a.STATION_EXIT_USER, a.STAGE_LATE_MINUTES, ");
		sSql.append(" a.STAGE_LATE_REASON_ID, a.STAGE_LATE_REMARK, ");
		sSql.append(" e.EMPLOYEE_ID, e.LAST_NAME, e.FIRST_NAME, e.JOB_ID, e.SHF_LOCKED, e.ORG_UNIT_ID ");
		sSql.append(" from SHIFTER.shf_employee_day d, SHIFTER.shf_day_changes c ");
		sSql.append(" left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = c.shf_employee_day_id ");
		sSql.append(" left join SHIFTER.shf_attendance a on c.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append(" left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append(" WHERE d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append(" AND e.emp_id_number = ?  ");
		sSql.append(" AND C.NEW_DAY_START -1/24 <= ?  ");
		sSql.append(" AND C.NEW_DAY_END + ?/1440 >= ?  ");   
		sSql.append(" ) ");
		
		String maxAfterEnd=SHFParameters.getMaxMinutesToExitAfterEnd(attendanceForm.getAllowedMoked()).getValue();
		 
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			//SELECT - 1
			dBAccess.setString(param++,attendanceForm.getUserId());
			dBAccess.setTimestamp(param++, new Date());
			dBAccess.setString(param++, maxAfterEnd);
			dBAccess.setTimestamp(param++, new Date());
			
			//SELECT - 2
			dBAccess.setString(param++, attendanceForm.getUserId());
			dBAccess.setTimestamp(param++, new Date());
			dBAccess.setString(param++, maxAfterEnd);
			dBAccess.setTimestamp(param++, new Date());

			
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			} 

		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in currentAgentDay : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in currentAgentDay while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	public void currentAgentDay() throws ShfException{
		logger.debug("Starting currentAgentDay()");

		StringBuffer sSql=new StringBuffer();
		DBAccess dBAccess=null;
		
		/*
		
		sSql.append("select d.*, ");
		
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
		
		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
		sSql.append("a.STAGE_ARRIVAL_USER , ");
		sSql.append("a.STATION_ARRIVAL_USER ,  ");
		sSql.append("a.LATE_MINUTES , ");
		sSql.append("a.LATE_REASON_ID , ");
		sSql.append("a.MISS_REASON_ID , ");
		sSql.append("a.MISSING_TIME , ");
		sSql.append("a.MISSING_REMARK , ");
		sSql.append("a.LATE_REMARK , ");
		sSql.append("a.STATION_EXIT_TIME, ");
		sSql.append("a.STATION_EXIT_USER, ");
		
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.SHF_LOCKED, ");
		sSql.append("e.ORG_UNIT_ID ");
		
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = c.new_employee_id ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append("WHERE e.emp_id_number = ? ");
		sSql.append("AND nvl(c.NEW_DAY_START,d.WM_SHIFT_START_DATETIME) -1/24 <= ? ");
		sSql.append("AND nvl(c.NEW_DAY_END,d.WM_SHIFT_END_DATETIME) + ?/1440 >= ?   ");

	*/	
		
		sSql.append("select d.wm_sch_activity_id_data, ");
		sSql.append("d.WM_END_DATETIME, ");
		sSql.append("d.WM_START_DATETIME, ");
		sSql.append("d.wm_day_type, ");
		sSql.append("d.emp_id_number, ");
		sSql.append("d.wm_exception_type_id, ");
		sSql.append("d.wm_work_minutes, ");
		sSql.append("d.wm_shift_end_datetime, ");
		sSql.append("d.wm_shift_start_datetime, ");
		sSql.append("d.wm_site_id, ");
		sSql.append("d.wm_timeoff_type_id, ");
		sSql.append("d.wm_work_minutes, ");
		sSql.append("d.SHF_EMPLOYEE_DAY_ID, ");
		sSql.append("null, ");
		sSql.append("null, ");
		sSql.append("null, ");
		sSql.append("null, ");
		sSql.append("null, ");
		
		
		
//		sSql.append("select d.*, ");
		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
		sSql.append("a.STAGE_ARRIVAL_USER , ");
		sSql.append("a.STATION_ARRIVAL_USER ,  ");
		sSql.append("a.LATE_MINUTES , ");
		sSql.append("a.LATE_REASON_ID , ");
		sSql.append("a.MISS_REASON_ID , ");
		sSql.append("a.MISSING_TIME , ");
		sSql.append("a.MISSING_REMARK , ");
		sSql.append("a.LATE_REMARK , ");
		sSql.append("a.STATION_EXIT_TIME, ");
		sSql.append("a.STATION_EXIT_USER, ");
		//fix yuval - moked not selected - 13.12.2010 - start
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.SHF_LOCKED, ");
		sSql.append("e.ORG_UNIT_ID ");
		//fix yuval - moked not selected - 13.12.2010 - end
		
		sSql.append("from SHIFTER.shf_employees e ,SHIFTER.shf_org_unit u,SHIFTER.shf_employee_day d  ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id  ");
		sSql.append("WHERE e.emp_id_number = ?  and ");
		sSql.append("substr(e.emp_id_number,1,8) = d.emp_id_number  and ");
		sSql.append("u.org_unit_id = e.org_unit_id ");
		sSql.append("AND d.WM_SHIFT_START_DATETIME -1/24 <= ? ");
		sSql.append("AND d.WM_SHIFT_END_DATETIME + ?/1440 >= ?   ");
		sSql.append("and d.shf_employee_day_id in ");
		sSql.append("(select d.shf_employee_day_id from SHIFTER.shf_employee_day d  minus select c.shf_employee_day_id ");
		sSql.append("from shifter.shf_day_changes c)  ");
		
		sSql.append("union  all");
		
		sSql.append(" select c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES ,");
		sSql.append("c.SHF_EMPLOYEE_DAY_ID, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
	
		
		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
		sSql.append("a.STAGE_ARRIVAL_USER , ");
		sSql.append("a.STATION_ARRIVAL_USER ,  ");
		sSql.append("a.LATE_MINUTES , ");
		sSql.append("a.LATE_REASON_ID , ");
		sSql.append("a.MISS_REASON_ID , ");
		sSql.append("a.MISSING_TIME , ");
		sSql.append("a.MISSING_REMARK , ");
		sSql.append("a.LATE_REMARK , ");
		sSql.append("a.STATION_EXIT_TIME, ");
		sSql.append("a.STATION_EXIT_USER, ");

		//fix yuval - moked not selected - 13.12.2010 - start
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.SHF_LOCKED, ");
		sSql.append("e.ORG_UNIT_ID ");
		//fix yuval - moked not selected - 13.12.2010 - end		
		
		sSql.append("from SHIFTER.shf_employees e ,SHIFTER.shf_org_unit u ,shifter.shf_day_changes c ");
		sSql.append("left join SHIFTER.shf_attendance a on c.new_employee_id=a.shf_employee_day_id   ");
		sSql.append("WHERE e.emp_id_number = ?  and "); 
		sSql.append("substr(e.emp_id_number,1,8) = c.new_employee_id and ");
		sSql.append("u.org_unit_id = e.org_unit_id   ");
		sSql.append("AND c.NEW_DAY_START -1/24 <= ? ");
		sSql.append("AND c.NEW_DAY_END + ?/1440 >= ?   ");
	
		
		
		
		String maxAfterEnd=SHFParameters.getMaxMinutesToExitAfterEnd(attendanceForm.getAllowedMoked()).getValue();
		
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setString(1,attendanceForm.getUserId());
			dBAccess.setTimestamp(2,new Date());
			dBAccess.setString(3,maxAfterEnd);
			dBAccess.setTimestamp(4,new Date());
			dBAccess.setString(5,attendanceForm.getUserId());
			dBAccess.setTimestamp(6,new Date());
			dBAccess.setString(7,maxAfterEnd);
			dBAccess.setTimestamp(8,new Date());
			
			
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			} 
		
	
		
		
		
	
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in currentAgentDay : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in currentAgentDay while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	
	
	public void checkChangeAgentDay(long dayId) throws ShfException{
		logger.debug("Starting checkChangeAgentDay()");

		StringBuffer sSql=new StringBuffer();
		DBAccess dBAccess=null;
		
		sSql.append("select  ");
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER ");
		
		sSql.append("from SHIFTER.shf_day_changes c ");
		sSql.append("WHERE c.SHF_EMPLOYEE_DAY_ID = ? ");
		
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setLong(1,dayId);
			
			dBAccess.executeQuery();
			if(dBAccess.next()){
				dBAccess.populate(attendanceForm);
			} 
	
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in checkChangeAgentDay : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in checkChangeAgentDay while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	
	
	
	
	
	public void exitStation() throws ShfException {
		logger.debug("Starting exitStation()");

		Date now=new Date();
		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			String queryCheck="select a.STATION_EXIT_TIME from SHIFTER.SHF_ATTENDANCE a where SHF_EMPLOYEE_DAY_ID = ? ";
			try{
				dBAccess.prepareStatement(queryCheck);
				dBAccess.setLong(1,attendanceForm.getAgentDayId());
				dBAccess.executeQuery();
				if(dBAccess.next()){
					EmployeeArriveForm tmp=new EmployeeArriveForm();
					dBAccess.populate(tmp);
					if(tmp.getStationExitTime()!=null){
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.dayExitAlreadyRegistered", null));
						throw new ShfException(actionErrors);
					}
				}
			} catch(DBQueryNoRowsException e){
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.dayExitNotRegistered", null));
				throw new ShfException(actionErrors);
			} catch(DBException e){
				logger.error("error in exitStation() in select station_exit_time query : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
			
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET STATION_EXIT_TIME = ? , STATION_EXIT_USER = ?  WHERE SHF_EMPLOYEE_DAY_ID = ? AND STATION_EXIT_TIME is null and STATION_ARRIVAL_TIME is not null" ;
			dBAccess.prepareStatement(query);
			dBAccess.setTimestamp(1,now);
			dBAccess.setString(2,userName);
			dBAccess.setLong(3,attendanceForm.getAgentDayId());
			dBAccess.executeUpdate();
			
			attendanceForm.setStationExitTime(now);
			attendanceForm.setStationExitUser(userName);
			
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.dayExitSucceeded", null));
			throw new ShfException(actionErrors);
			

		} catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.dayExitNotRegistered", null));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in exitStation() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	/**
	 * @param dayId
	 */
	public static void cancelLate(long dayId) throws ShfException {
		logger.debug("Starting cancelLate()");

		String sql="update SHIFTER.shf_attendance e set e.late_minutes=? , e.late_remark=? , e.late_reason_id=? where e.shf_employee_day_id=?";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInteger(1,null);
			db.setString(2,null);
			db.setInteger(3,null);
			db.setLong(4,dayId);
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.deleteFailed", null));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in cancelLate() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	/**
	 * @param dayId
	 */
	public static void cancelStageLate(long dayId) throws ShfException {
		logger.debug("Starting cancelStageLate()");

		String sql="update SHIFTER.shf_attendance e set e.stage_late_minutes=? , e.stage_late_remark=? , e.stage_late_reason_id=? where e.shf_employee_day_id=?";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInteger(1,null);
			db.setString(2,null);
			db.setInteger(3,null);
			db.setLong(4,dayId);
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.deleteFailed", null));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in cancelStageLate() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	
	}

	/**
	 * @param dayId
	 */
	public static void cancelMissing(long dayId) throws ShfException {
		logger.debug("Starting cancelMissing()");

		String sql="update SHIFTER.shf_attendance e set e.missing_time=? , e.missing_remark=? , e.miss_reason_id=? where e.shf_employee_day_id=?";
		String sqlReportDelete="delete from SHIFTER.shf_employee_reports t where t.SHF_EMPLOYEE_DAY_ID=?";
		
		DBAccess db=null;
		try {
			db=new DBAccess(false);
			db.prepareStatement(sql);
			db.setTimestamp(1,null);
			db.setString(2,null);
			db.setInteger(3,null);
			db.setLong(4,dayId);
			db.executeUpdate();
			
			try{
				db.prepareStatement(sqlReportDelete);
				db.setLong(1,dayId);
				db.executeUpdate();
			}catch(DBUpdateNoRowsException e){}
			
			db.commit();
			logger.info("cancel missing committed");
		}catch(DBUpdateNoRowsException e){
			try {
				db.rollback();
			} catch (DBException e1) {
				
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.deleteFailed", null));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			try {
				db.rollback();
			} catch (DBException e1) {
				
			}
			logger.error("error in cancelMissing() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public boolean checkLock(int missingNum) throws ShfException{
		logger.debug("Starting checkLock()");
		
		boolean result=false;
		logger.info("check if employee should be locked");

		StringBuffer sSql=new StringBuffer();
		sSql.append("select d.*, ");
		
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
		
		sSql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sSql.append("a.STATION_ARRIVAL_TIME ,  ");
		sSql.append("a.STAGE_ARRIVAL_USER , ");
		sSql.append("a.STATION_ARRIVAL_USER ,  ");
		sSql.append("a.LATE_MINUTES , ");
		sSql.append("a.LATE_REASON_ID , ");
		sSql.append("a.MISS_REASON_ID , ");
		sSql.append("a.MISSING_TIME , ");
		sSql.append("a.MISSING_REMARK , ");
		sSql.append("a.LATE_REMARK , ");
		sSql.append("a.STATION_EXIT_TIME, ");
		sSql.append("a.STATION_EXIT_USER, ");
		sSql.append("a.STAGE_LATE_MINUTES , ");
		sSql.append("a.STAGE_LATE_REASON_ID , ");
		sSql.append("a.STAGE_LATE_REMARK , ");
		
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID ");
		
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append("where substr(e.emp_id_number,1,8)= ? and nvl(c.new_shift_start,d.wm_shift_start_datetime)< ? ");
		sSql.append("order by nvl(c.new_shift_start,d.wm_shift_start_datetime) desc");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setString(1,((AttendanceSearchForm)attendanceForm).getEmpIdNumber());
			db.setTimestamp(2,attendanceForm.getShiftStart());
			db.executeQuery();
			AgentDayBean day=null;
			while(db.next() && --missingNum>0){
				day=new AgentDayBean();
				db.populate(day);
				if(day.getMissingReasonId()<=0){
					return false;
				}
			}
			return true;
		}catch(DBQueryNoRowsException e){
			return false;
		}catch(DBException e){
			logger.error("error in checkLock() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try{
				sSql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	private void validateCancelStation() throws ShfException{
		logger.debug("Starting validateCancelStation()");
		
		populateAgentDay();
		populateAttendance();
		if(attendanceForm.getStationArrivalTime()==null){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelStationNotExist"));
			throw new ShfException(actionErrors);
		}
		if(attendanceForm.getStationExitTime()!=null){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelStationHasExit"));
			throw new ShfException(actionErrors);
		}
	}
	
	private void validateCancelExitStation() throws ShfException{
		logger.debug("Starting validateCancelExitStation()");
		
		populateAgentDay();
		populateAttendance();
		if(attendanceForm.getStationExitTime()==null){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelExitNotExist"));
			throw new ShfException(actionErrors);
		}
	}
	
	public void cancelExitStation() throws ShfException{
		logger.debug("Starting cancelExitStation()");
		
		validateCancelExitStation();

		int param=1;
		String sql="update SHIFTER.shf_attendance e set " +
			"e.STATION_EXIT_TIME=? , " +
			"e.STATION_EXIT_USER=?  " +
			"where e.shf_employee_day_id=? AND e.STATION_EXIT_TIME is not null ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setTimestamp(param++,null);
			db.setString(param++,null);
			db.setLong(param++,attendanceForm.getAgentDayId());
			db.executeUpdate();
			
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelExitNotExist"));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in cancelExitStation() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void cancelRegisterStation() throws ShfException{
		logger.debug("Starting cancelRegisterStation()");
		
		validateCancelStation();

		int param=1;
		String sql="update SHIFTER.shf_attendance e set " +
			"e.LATE_MINUTES=? , " +
			"e.LATE_REASON_ID=? , " +
			"e.LATE_REMARK=? , " +
			"e.STATION_ARRIVAL_TIME=? , " +
			"e.STATION_ARRIVAL_USER=? , " +
			"e.STATION_EXIT_TIME=? , " +
			"e.STATION_EXIT_USER=?  " +
			"where e.shf_employee_day_id=?";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInteger(param++,null);
			db.setInteger(param++,null);
			db.setString(param++,null);
			db.setTimestamp(param++,null);
			db.setString(param++,null);
			db.setTimestamp(param++,null);
			db.setString(param++,null);
			db.setLong(param++,attendanceForm.getAgentDayId());
			db.executeUpdate();
			attendanceForm.setStationArrivalTime(null);
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelStationNotExist"));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in cancelRegisterStation() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	
	public void removeFlag() throws ShfException{
		logger.debug("Starting removeFlag()");

		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		DBAccess db=null;
		try {
			db=new DBAccess();
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET OPTIONAL1 = ? WHERE SHF_EMPLOYEE_DAY_ID = ? AND OPTIONAL1 is not null " ;
			db.prepareStatement(query);
			db.setString(1,null);
			db.setLong(2,attendanceForm.getAgentDayId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.cancelFlagNotExist"));
			throw new ShfException(actionErrors);
		}catch(DBException e){
			logger.error("error in removeFlag() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void cancelReport() throws ShfException{
		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
			String query="delete from SHIFTER.SHF_EMPLOYEE_REPORTS WHERE t.SHF_EMPLOYEE_DAY_ID=? " ;
			db.prepareStatement(query);
			db.setLong(param++,attendanceForm.getAgentDayId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
		
		} catch(DBException e){
			logger.error("error in cancelReport() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in cancelReport(): while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}

	}
	
	public void approveReport() throws ShfException{
		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
			String query="UPDATE SHIFTER.SHF_EMPLOYEE_REPORTS t SET t.APPROVED=? , t.APPROVED_BY=? , t.APPROVED_TIME=? WHERE t.SHF_EMPLOYEE_DAY_ID=? " ;
			db.prepareStatement(query);
			db.setInt(param++,1);
			db.setString(param++,userName);
			db.setTimestamp(param++,new Date());
			db.setLong(param++,attendanceForm.getAgentDayId());
			
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			
		} catch(DBException e){
			logger.error("error in approveRequest() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error in approveRequest(): while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}

	}
	
	public void doFlag() throws ShfException{
		logger.debug("Starting doFlag()");

		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		DBAccess db=null;
		try {
			db=new DBAccess();
			String query="UPDATE SHIFTER.SHF_ATTENDANCE SET OPTIONAL1 = ? WHERE SHF_EMPLOYEE_DAY_ID = ? " ;
			db.prepareStatement(query);
			db.setString(1,attendanceForm.getFlag()+"#"+attendanceForm.getUserId());
			db.setLong(2,attendanceForm.getAgentDayId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			String query="INSERT INTO SHIFTER.SHF_ATTENDANCE(SHF_EMPLOYEE_DAY_ID,OPTIONAL1) values(?,?)";
			try {
				db.prepareStatement(query);
				db.setLong(1,attendanceForm.getAgentDayId());
				db.setString(2,attendanceForm.getFlag()+"#"+attendanceForm.getUserId());
				db.executeUpdate();
				
			} catch (DBException e1) {
				logger.error("error in doFlag() inserting attendance record: "+e1.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			
		} catch(DBException e){
			logger.error("error in doFlag() update attendance record: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}

	/**
	 *  Author: Yuval
	 */
	public Vector populateApproveManager() throws ShfException{
		logger.debug("Starting populateApproveManager() dayId = " + attendanceForm.getAgentDayId());
		int param_index=1;
		EmployeeBean empBean=null;
		String moked=SHFTableUtils.getMokedCodeOf(attendanceForm.getOrgUnitCode());
		Vector jobCodVec = new Vector();
		String jobsConfirm = SHFParameters.getJobsToConfirmExit(moked).getValue();
		StringTokenizer st = new StringTokenizer(jobsConfirm, ",");
		while (st.hasMoreTokens()) {
			jobCodVec.add(st.nextToken().toString().trim());
		}
		
		Vector approveManager=new Vector();
		StringBuffer sSql = new StringBuffer();
		sSql.append(" SELECT E.* ");
		sSql.append(" FROM SHIFTER.SHF_EMPLOYEES E " );
		sSql.append(" LEFT JOIN SHIFTER.SHF_ORG_UNIT O ON E.ORG_UNIT_ID = O.ORG_UNIT_ID " );
		sSql.append(" WHERE E.JOB_ID IN ( ");

		String jobIds = "";	
		for(int i=0; i<jobCodVec.size();i++) {
			jobIds = jobIds + (String)jobCodVec.get(i);
			if ((i+1)<jobCodVec.size()) jobIds = jobIds + ",";
		}
		sSql.append(jobIds);
		sSql.append("  ) " );
		sSql.append(" AND ( (? = E.ORG_UNIT_ID) OR (? = O.PARENT_UNIT) ) ");
		sSql.append(" AND E.STATUS_ID = ?");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());

			db.setString(param_index++,moked);
			db.setString(param_index++,moked);
			db.setInt(param_index++,SHFConstants.EMPLOYEE_STATUS_ACTIVE);
			db.executeQuery();
			while(db.next()){
				empBean=new EmployeeBean();
				db.populate(empBean);
				approveManager.add(empBean.getFname() + " " + empBean.getLname());
			}
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateApproveManager : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed",null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error in populateApproveManager while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return approveManager;
	}
	
	
	
	/**
	 *  Author: Yuval
	 */
	public Vector getAllShiftBetween(String missStartDate, String missEndDate, EmployeeArriveForm empForm) throws ShfException{
		logger.debug("Starting getAllShiftBetween() dayId = " + attendanceForm.getAgentDayId());
		int param_index=1;
		AgentDayBean dayBean=null;
		Vector agentDayVec = new Vector();
		
		Date startDate;
		Date endDate;
		
		try{
			startDate=BaseConvert.stringToDate(missStartDate,"dd/MM/yyyy");
			endDate=BaseConvert.stringToDate(missEndDate,"dd/MM/yyyy");
		}catch(ConvertException e){
			logger.error("error in getAllShiftBetween() while converting string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		
		
		Vector missAgentDay=new Vector();
		StringBuffer sSql = new StringBuffer();
		sSql.append(" SELECT d.* ");
		sSql.append(" FROM SHIFTER.SHF_EMPLOYEE_DAY D");
		sSql.append(" left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append(" left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sSql.append(" WHERE WM_DATE BETWEEN ? AND ? " );
		sSql.append(" AND e.employee_id = ? " );
		sSql.append(" AND NVL(C.NEW_DAY_TYPE,D.WM_DAY_TYPE)=? " );
		

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());

			db.setDate(param_index++,startDate);
			db.setDate(param_index++,endDate);
			db.setLong(param_index++,empForm.getEmployeeId());
			db.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.executeQuery();
			BreakBean breakInfo=null; 
			while(db.next()){
				dayBean=new AgentDayBean();
				db.populate(dayBean);
				agentDayVec.add( String.valueOf(dayBean.getAgentDayId()));
			}
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in getAllShiftBetween : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed",null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error in getAllShiftBetween while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return agentDayVec;
	}

	public void setTadreech() throws ShfException{
		logger.debug("Starting setTadreech()");
		int tad=((EmployeeArriveForm)attendanceForm).getTadreech();
		int param=1;
		String sql="update SHIFTER.shf_attendance e set " +
			"e.TADREECH = ?  " +
			"where e.shf_employee_day_id=?";
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInt(param++,tad);
			db.setLong(param++,attendanceForm.getAgentDayId());
			db.executeUpdate();
			attendanceForm.setTadreech(tad);
		}catch(DBUpdateNoRowsException e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} catch(DBException e){
			logger.error("error in cancelTadreech() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}

	public void addEntryMood(int moodCode, int entryCode) throws ShfException{
		logger.debug("addEntryMood for " + attendanceForm.getAgentDayId());

		String userName=attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName();
		//attendanceForm.getShiftStart();
		int param_index = 1;
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			String query="UPDATE SHIFTER.SHF_EMPLOYEE_ENTRANCE_MOOD SET ENTRY_CODE = ?, SMILE_CODE = ?   WHERE EMP_DAY_ID = ? AND ENTRY_CODE = ? " ;
			dBAccess.prepareStatement(query);
			dBAccess.setInt(param_index++,entryCode);
			dBAccess.setInt(param_index++, moodCode);
			dBAccess.setLong(param_index++,attendanceForm.getAgentDayId());
			dBAccess.setInt(param_index++,entryCode);
			dBAccess.executeUpdate();

		} catch (DBUpdateNoRowsException e){
			param_index = 1;
			String query="INSERT INTO SHIFTER.SHF_EMPLOYEE_ENTRANCE_MOOD(EMP_DAY_ID, ENTRY_CODE, SMILE_CODE) values(?,?,?)";		
			try {
				dBAccess.prepareStatement(query);
				dBAccess.setLong(param_index++,attendanceForm.getAgentDayId());
				dBAccess.setInt(param_index++,entryCode);
				dBAccess.setInt(param_index++, moodCode);
				dBAccess.executeUpdate();

			} catch(DBException e1){
				logger.error("error in inserting entry mood : "+e1.getMessage());
			} 
		} catch (DBException e) {
			logger.error("error in inserting entry mood : "+e.getMessage());
		} finally{
			try{
				dBAccess.close();
			}catch (DBException e) {
				logger.error("error in inserting entry mood  while closing db connection: "+e.getMessage());
			}
		}
		
	}	

}
