package bzq.shf.model;

import java.util.Date;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ActivityCancelForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

public class ShiftCancelledModel {
	private static Logger logger = Logger.getLogger(ShiftCancelledModel.class);
	private ActivityCancelForm cancelForm;
	public ShiftCancelledModel(ActivityCancelForm form) {
		this.cancelForm = form;
	}
	public ShiftCancelledModel(){
		
	}

	public void setCurrentDefaults() {
		logger.debug("Starting setCurrentDefaults()");
		
		cancelForm.setTimeFrom("07:00");
		cancelForm.setTimeTo("22:00");
		cancelForm.setDate(new Date());
		if(cancelForm.getAllowedMoked()!=null){
			cancelForm.setMoked(cancelForm.getAllowedMoked());
		}		
		
	}
	
	public Vector populateCancelled() throws ShfException{
		Vector v1=populateShiftCancelledList();
		Vector v2=populateCancelledFullDayExceptions();
		Vector v3=populateCancelledEmployeeExceptions();
		
		v1.addAll(v2);
		v1.addAll(v3);
		return v1;
	}
	/*
	 * שליפת כל המשמרות המבוטלות 
	*/

	public Vector populateShiftCancelledList() throws ShfException {
		logger.debug("beginning of populateShiftCancelledList.");
		int param_index=1;
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
		sSql.append("c.CANCEL_REASON_CODE, ");
		sSql.append("c.CANCEL_REASON_REMARK, ");
		
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
		sSql.append("a.OPTIONAL1 , ");
		sSql.append("a.TADREECH , ");
		
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID ,");
		sSql.append("e.INNER_JOB_ID ");
		
		//Yuval-from here
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append("where c.NEW_EMPLOYEE_ID =99999999 ");
		
		
		sSql.append("and  (NVL(c.NEW_SHIFT_START,d.wm_shift_start_datetime) between ? and ?) ");
		
		if(cancelForm.getMoked()!=null && !cancelForm.getMoked().equals("-1")){
			if(cancelForm.getTeam()!=null && !cancelForm.getTeam()[0].equals("00")){
				sSql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = cancelForm.getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sSql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=cancelForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		
				
		if( cancelForm.getInnerJob()!=null && (!"00".equals(cancelForm.getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = cancelForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		// Svetlana
		/*if( cancelForm.getActivity()!=null && (!"00".equals(cancelForm.getActivity()[0]))){
			sSql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = cancelForm.getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}*/
			
		
		
		if( cancelForm.getInnerJob()!=null && (!"00".equals(cancelForm.getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = cancelForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		sSql.append(" ORDER BY d.wm_shift_start_datetime,e.FIRST_NAME,e.LAST_NAME");
		
	

		String dayDate=BaseConvert.dateToString(cancelForm.getDate(),"dd/MM/yyyy");
		String timeFrom=dayDate+" "+cancelForm.getTimeFrom()+":00";
		String timeTo=dayDate+" "+cancelForm.getTimeTo()+":00";
		Date timeFromDate=null,timeToDate=null;
		try{
			timeFromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
			timeToDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			logger.error("error in populateShiftCancelledList() while converting string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		Vector attlist=new Vector();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setTimestamp(param_index++,timeFromDate);	
			dBAccess.setTimestamp(param_index++,timeToDate);
	
			if(cancelForm.getMoked()!=null && !cancelForm.getMoked().equals("-1")){
				if(cancelForm.getTeam()!=null && !cancelForm.getTeam()[0].equals("00")){
					
				}else{
					dBAccess.setString(param_index++,cancelForm.getMoked());
					dBAccess.setString(param_index++,cancelForm.getMoked());
				}
											
				}else{
				
			}
			
			
			dBAccess.executeQuery();
			
			AgentDayBean dayInfo=null;
			while(dBAccess.next()){
				dayInfo=new AgentDayBean();
				dBAccess.populate(dayInfo);
				dayInfo.setWmExceptionId(0);
				attlist.add(dayInfo);
			}
			
			
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateShiftCancelledList() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sSql=null;
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateShiftCancelledList() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return attlist;
	}
	/*
	 * שליפת כל המשמרות שהסוג שלהם שונה מ -4 
	*/
	public Vector populateCancelledFullDayExceptions() throws ShfException {
		logger.debug("beginning of populateShiftCancelledList.");
		int param_index=1;
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("select d.*, ");
		//sSql.append("c.NEW_ACTIVITY, ");
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
		sSql.append("c.CANCEL_REASON_CODE, ");
		sSql.append("c.CANCEL_REASON_REMARK, ");
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
		sSql.append("a.OPTIONAL1 , ");
		sSql.append("a.TADREECH , ");
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.LAST_NAME, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID ,");
		sSql.append("e.INNER_JOB_ID ");
		
		sSql.append("from SHIFTER.shf_employee_day d ");
		sSql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sSql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sSql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sSql.append("where c.CANCEL_REASON_CODE is not null ");
		sSql.append("AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)<> 4  ");
		
		sSql.append("and d.wm_date between ? and ? ");
		
		if(cancelForm.getMoked()!=null && !cancelForm.getMoked().equals("-1")){
			if(cancelForm.getTeam()!=null && !cancelForm.getTeam()[0].equals("00")){
				sSql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = cancelForm.getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sSql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=cancelForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		
		
		if( cancelForm.getExceptionCode()!=null && (!"00".equals(cancelForm.getExceptionCode()[0]))){
			
			sSql.append("AND nvl(c.NEW_EXCEPTION_TYPE_ID,d.WM_EXCEPTION_TYPE_ID ) in ( ");
			String[] array = cancelForm.getExceptionCode();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		
		
		if( cancelForm.getInnerJob()!=null && (!"00".equals(cancelForm.getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = cancelForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		

		String dayDate=BaseConvert.dateToString(cancelForm.getDate(),"dd/MM/yyyy");
		String timeFrom=dayDate+" "+cancelForm.getTimeFrom()+":00";
		String timeTo=dayDate+" "+cancelForm.getTimeTo()+":00";
		Date timeFromDate=null,timeToDate=null;
		try{
			timeFromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
			timeToDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			logger.error("error in populateShiftCancelledList() while converting string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		Vector attlist=new Vector();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setTimestamp(param_index++,timeFromDate);	
			dBAccess.setTimestamp(param_index++,timeToDate);
	
			if(cancelForm.getMoked()!=null && !cancelForm.getMoked().equals("-1")){
				if(cancelForm.getTeam()!=null && !cancelForm.getTeam()[0].equals("00")){
					
				}else{
					dBAccess.setString(param_index++,cancelForm.getMoked());
					dBAccess.setString(param_index++,cancelForm.getMoked());
				}
											
				}else{
				
			}
			
				
			dBAccess.executeQuery();
			
			AgentDayBean dayInfo=null;
			while(dBAccess.next()){
				dayInfo=new AgentDayBean();
				dBAccess.populate(dayInfo);
				dayInfo.setWmShiftStartTime(dayInfo.getDate());
				dayInfo.setWmShiftEndTime(dayInfo.getDate());
				dayInfo.setWmActivityId(null);
				attlist.add(dayInfo);
			}
			
			
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateShiftCancelledList() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sSql=null;
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateShiftCancelledList() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return attlist;
	}
	/*
	 * שליפת כל הפעילויות המבוטלות 
	*/
	public Vector populateCancelledEmployeeExceptions() throws ShfException {
		          
		logger.debug("beginning of populateCancelledEmloyeeExceptions.");
		int param_index=1;
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("select ee.end_time as WM_SHIFT_END_DATETIME , ");
		sSql.append("ee.start_time as WM_SHIFT_START_DATETIME , ");
		sSql.append("e.last_name as LAST_NAME , " );
		sSql.append("e.first_name as FIRST_NAME ,");
		sSql.append("e.employee_id as EMPLOYEE_ID ,");
		sSql.append("ee.modification_user as MODIFICATION_USER ,");
		sSql.append("u.org_unit_name as ORG_UNIT_ID, d.remark as REMARK, ");
		sSql.append("ee.modification_time as MODIFICATION_TIME , ");
		sSql.append("ee.CANCEL_REASON_REMARK as CANCEL_REASON_REMARK , ");
		//sSql.append("d.wm_sch_activity_id_data as WM_SCH_ACTIVITY_ID_DATA , ");
		sSql.append("e.inner_job_id as INNER_JOB_ID, ");
		sSql.append("e.ORG_UNIT_ID as ORG_UNIT_ID, ");
		sSql.append("ee.exception_type as WM_EXCEPTION_TYPE_ID, ");
		sSql.append("ee.cancel_reason_code as CANCEL_REASON_CODE, ");
		sSql.append("c.switch_day_id as SWITCH_DAY_ID, ");
		sSql.append("d.source as SOURCE ,");
		sSql.append("d.shf_employee_day_id as SHF_EMPLOYEE_DAY_ID ");
		
		sSql.append("from shifter.shf_employee_exceptions  ee ");
		sSql.append("left join SHIFTER.Shf_Employee_Day d on (d.shf_employee_day_id = ee.agent_day_id) ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES e ON SUBSTR(e.EMP_ID_NUMBER,1,8) = d.emp_id_number  ");
		sSql.append("LEFT JOIN SHIFTER.Shf_Day_Changes c ON c.shf_employee_day_id = d.shf_employee_day_id ");
		sSql.append("LEFT JOIN SHIFTER.Shf_Org_Unit  u ON u.org_unit_id = e.org_unit_id ");
		
		sSql.append("where ee.state_type is not null and ee.source = 'DEL' and ee.exception_type > 0 ");
		sSql.append("and  ee.state_type <> 4  and ee.cancel_reason_code is not null ");
		sSql.append("and  ee.start_time between ? and ?");
		if(cancelForm.getMoked()!=null && !cancelForm.getMoked().equals("-1")){
			if(cancelForm.getTeam()!=null && !cancelForm.getTeam()[0].equals("00")){
				sSql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = cancelForm.getTeam();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sSql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=cancelForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sSql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sSql.append(",");
			}
			sSql.append(") ");
		}
		
				
		if( cancelForm.getInnerJob()!=null && (!"00".equals(cancelForm.getInnerJob()[0]))){
			sSql.append("AND e.INNER_JOB_ID in (");
			String[] array = cancelForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		/*if( cancelForm.getActivity()!=null && (!"00".equals(cancelForm.getActivity()[0]))){
			sSql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = cancelForm.getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}*/
			
		
		if( cancelForm.getExceptionCode()!=null && (!"00".equals(cancelForm.getExceptionCode()[0]))){
			
			sSql.append("AND ee.exception_type in ( ");
			String[] array = cancelForm.getExceptionCode();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		
		String dayDate=BaseConvert.dateToString(cancelForm.getDate(),"dd/MM/yyyy");
		String timeFrom=dayDate+" "+cancelForm.getTimeFrom()+":00";
		String timeTo=dayDate+" "+cancelForm.getTimeTo()+":00";
		Date timeFromDate=null,timeToDate=null;
		try{
			timeFromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
			timeToDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			logger.error("error in populateShiftCancelledList() while converting string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		
		Vector attlist=new Vector();
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			String moked=cancelForm.getMoked();
			String[] teams=cancelForm.getTeam();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setTimestamp(param_index++,timeFromDate);	
			dBAccess.setTimestamp(param_index++,timeToDate);
			if(moked!=null && !moked.equals("-1")){
				if(teams!=null && !teams[0].equals("00")){
					//dBAccess.setString(param_index++,((ActivityCancelForm)attendanceForm).getTeam());	
				}else{
					dBAccess.setString(param_index++,moked);
					dBAccess.setString(param_index++,moked);
				}
											
				}else{
				
			}
			dBAccess.executeQuery();
			
			AgentDayBean dayInfo=null;
			while(dBAccess.next()){
				dayInfo=new AgentDayBean();
				dBAccess.populate(dayInfo);
				attlist.add(dayInfo);
			}
			
			
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateCancelledEmloyeeExceptions() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateCancelledEmloyeeExceptions() while closing db connection",e);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return attlist;
	}
	
	
}
