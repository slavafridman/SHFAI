/*
 * Created on 23/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
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
import bzq.shf.bean.ExceptionBean;
import bzq.shf.bean.ExceptionSearchBean;
import bzq.shf.forms.EmployeeExceptionForm;
import bzq.shf.forms.ExceptionSearchForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ExceptionDataModel {
	
	private static Logger logger = Logger.getLogger(ExceptionDataModel.class);
	private ExceptionSearchForm exceptionForm;
	private EmployeeExceptionForm employeeExceptionForm;
	
	public ExceptionDataModel(ExceptionSearchForm exceptionSearchForm){
		this.exceptionForm=exceptionSearchForm;
	}
	
	public ExceptionDataModel(EmployeeExceptionForm employeeExceptionForm){
		this.employeeExceptionForm=employeeExceptionForm;
	}
	
	public ExceptionDataModel() {
		
	}
	
	public void deleteException() throws ShfException{
		if(employeeExceptionForm.getFullday()==1){
			deleteFullDayException();
		}else {
			cancelException();
		}
	}
	
	public void deleteFullDayException() throws ShfException{
		logger.info("Starting deleteFullDayException() dayId = " + employeeExceptionForm.getAgentDayId());
		AgentDayBean day=ShiftDataModel.populateShift(employeeExceptionForm.getAgentDayId());
		
		ShiftDataForm shiftInfo=new ShiftDataForm();
		shiftInfo.setAgentDayId(employeeExceptionForm.getAgentDayId());
		shiftInfo.setUserFirstName(employeeExceptionForm.getUserFirstName());
		shiftInfo.setUserLastName(employeeExceptionForm.getUserLastName());
		ShiftDataModel shift=new ShiftDataModel(shiftInfo);
		shift.cancelShift();
		
	}
	
	public void validateCancelException() throws ShfException{
		if(employeeExceptionForm.getAgentDayId()<=0){
			logger.error("error in cancelException() agentDayId not valid ");
			throw new ShfException(new ActionError("shf.error.deleteFailed"));
		}
		if(employeeExceptionForm.getStartTime()==null){
			logger.error("error in cancelException() startTime not valid ");
			throw new ShfException(new ActionError("shf.error.deleteFailed"));
		}
		if(employeeExceptionForm.getStateType()<=0){
			logger.error("error in cancelException() stateType not valid ");
			throw new ShfException(new ActionError("shf.error.deleteFailed"));
		}
		if(employeeExceptionForm.getCancelReasonCode()==null){
			logger.error("error in cancelException() cancel reason not valid ");
			throw new ShfException(new ActionError("shf.error.deleteFailed"));
		}
	}
	
	public void cancelDayParts(DBAccess db) throws DBException{
		logger.info("Starting cancelDayPartials() dayId = " + employeeExceptionForm.getAgentDayId());
		String sql="UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS SET SOURCE='DEL' , MODIFICATION_TIME=? , MODIFICATION_USER=? , CANCEL_REASON_CODE=? , CANCEL_REASON_REMARK=? "+
					" WHERE AGENT_DAY_ID=? ";
		int param=1;
			
		//change shift source.
		db.prepareStatement(sql);
		db.setTimestamp(param++,new Date());
		
		db.setString(param++,employeeExceptionForm.getUserFirstName()+" "+employeeExceptionForm.getUserLastName());
		db.setString(param++,employeeExceptionForm.getCancelReasonCode());
		db.setString(param++,employeeExceptionForm.getCancelRemark());
		db.setLong(param++,employeeExceptionForm.getAgentDayId());
		
		db.executeUpdate();
	}
	
	public void cancelException() throws ShfException{
		validateCancelException();
		logger.info("Starting cancelException() dayId = " + employeeExceptionForm.getAgentDayId()+" starting at "+employeeExceptionForm.getStartTime());
		String sql="UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS SET SOURCE='DEL' , MODIFICATION_TIME=? , MODIFICATION_USER=? , CANCEL_REASON_CODE=? , CANCEL_REASON_REMARK=? "+
					" WHERE AGENT_DAY_ID=? AND START_TIME=? AND STATE_TYPE=?";
		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
			//change shift source.
			ShiftDataModel.changeShiftSource(db,employeeExceptionForm.getAgentDayId(),"SHF","WFM");		
			db.prepareStatement(sql);
			db.setTimestamp(param++,new Date());
			db.setString(param++,employeeExceptionForm.getUserFirstName()+" "+employeeExceptionForm.getUserLastName());
			db.setString(param++,employeeExceptionForm.getCancelReasonCode());
			db.setString(param++,employeeExceptionForm.getCancelRemark());
			db.setLong(param++,employeeExceptionForm.getAgentDayId());
			db.setTimestamp(param++,employeeExceptionForm.getStartTime());
			db.setInt(param++,employeeExceptionForm.getStateType());
			db.executeUpdate();
		}catch (DBException e) {
			logger.error("error at cancelException() : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error at cancelException() while closing dbAccess : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	} // END METHOD
	
	public void cancelExceptionForcedSwitch(){ // Igal 5.2013
		String sql="UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS SET SOURCE='DEL' , MODIFICATION_TIME=? , MODIFICATION_USER=? , CANCEL_REASON_CODE='721' "+
					" WHERE AGENT_DAY_ID=? AND STATE_TYPE=3";
		int param=1;
		DBAccess db=null;
		db=new DBAccess();
		try {
			db=new DBAccess();
			ShiftDataModel.changeShiftSource(db,employeeExceptionForm.getAgentDayId(),"SHF","WFM");
			db.prepareStatement(sql); 
			db.setTimestamp(param++,new Date()); //1
			db.setString(param++,employeeExceptionForm.getUserFirstName()+" "+employeeExceptionForm.getUserLastName()); //2
			db.setLong(param++,employeeExceptionForm.getAgentDayId()); //3
			
			db.executeUpdate();
			
		} catch (DBException e) {
			logger.error("error at cancelExceptionForcedSwitch() : "+e.getMessage());
			
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error at cancelException() while closing dbAccess : "+e.getMessage());
				
			}
			
		}
	} // END METHOD
	
	
	public static boolean isShiftContainsExceptions(long dayId) throws ShfException{
		logger.debug("Starting isShiftContainsExceptions() dayId = "+dayId);
		String sql="select * from SHIFTER.shf_employee_exceptions t where t.agent_day_id=? and t.state_type>0 and t.state_type <> ? and t.CANCEL_REASON_CODE is null ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setLong(1,dayId);
			db.setInt(2,SHFConstants.STATE_BREAK);
			db.executeQuery();
			if(db.next()) return true;
		}catch(DBQueryNoRowsException e){ 
			return false;
		}catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return false;
	}
	
	public static boolean isShiftContainsExceptionsNoSplit(long dayId) throws ShfException{
		logger.debug("Starting isShiftContainsExceptionsNoSplit() dayId = "+dayId);
		StringBuilder sql = new StringBuilder(); 
		sql.append("SELECT E.AGENT_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS E ");		
		sql.append("LEFT JOIN SHIFTER.SHF_EXCEPTION_TYPE T ON T.EXCEPTION_TYPE_ID = E.EXCEPTION_TYPE ");
		sql.append("WHERE E.AGENT_DAY_ID = ? AND E.STATE_TYPE > 0 AND E.STATE_TYPE <> ? AND E.CANCEL_REASON_CODE IS NULL AND T.SPLIT_SHIFT = 'N'");			   
			   
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(1,dayId);
			db.setInt(2,SHFConstants.STATE_BREAK);
			db.executeQuery();
			if(db.next()) return true;
		}catch(DBQueryNoRowsException e){ 
			return false;
		}catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return false;
	}
	
	public static Vector<ExceptionSearchBean>  populateExcepByDayVec( Vector<AgentDayBean> allShifts ) throws ShfException {
		logger.debug("Starting populateExcepByDayVec()");
		Vector<ExceptionSearchBean> result = null;
		if ( allShifts == null ) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		
		StringBuffer sql = new StringBuffer();
		sql.append("select * from SHIFTER.shf_employee_exceptions t where t.agent_day_id in ( ");
		int k = 0;
		for (int i = 0; i < allShifts.size(); i++) {
			if (k == 998) {	// oracle ORA-01795 - 1000 limit
				k = 0;
				sql.append(" ) \n OR t.agent_day_id IN ( "+allShifts.get(i).getAgentDayId());
				if (i < allShifts.size() - 1 ) {
					sql.append(",");
				}
				continue;
			}
			sql.append( allShifts.get(i).getAgentDayId() );
			if (i < allShifts.size() - 1 && k < 997) {
				sql.append(",");
			}
			k++;
		}
		sql.append(" )and t.state_type>0 and t.state_type <> ? and t.CANCEL_REASON_CODE is null ");
		
		DBAccess db=null;
		try {
			db = new DBAccess();
			result = new Vector<ExceptionSearchBean>();
			db.prepareStatement(sql.toString());
			db.setInt(1,SHFConstants.STATE_BREAK);
			db.executeQuery();
			db.populate("bzq.shf.bean.ExceptionSearchBean",result);
			
		}catch(DBQueryNoRowsException e){ 
			
		}catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return result;
	}


	public void setFormDefaults() {
		if(exceptionForm.getAllowedMoked()!=null){
			exceptionForm.setMoked(exceptionForm.getAllowedMoked());
		}
		Date date=new Date();
		exceptionForm.setDate(BaseConvert.dateToString(date, "dd/MM/yyyy"));
		exceptionForm.setTimeFrom("07:00");
		exceptionForm.setTimeTo("16:00");
	}

	
	public Vector populateAllExceptions() throws ShfException{
		Vector v1 = populateExceptionsList();
		Vector v2 = populateFullDayExceptions();
		Vector v3 = populateTimeoffDays();
		v1.addAll(v2);
		v1.addAll(v3);
		return v1;
	}
	
	/**
	 * Method to get user exceptions by type and day id
	 * from shifter.shf_employee_exceptions table
	 *  
	 * @param type the relevant type
	 * @return Vector <ExceptionBean>
	 */
	public Vector<ExceptionBean> populateUserExceptionsNoBreaks (long shiftDayID ) throws ShfException {
		logger.debug("Starting populateUserExceptionsNoBreaks() dayId = " + shiftDayID);
		
		Vector <ExceptionBean> exceptions = new Vector<ExceptionBean>();
		
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT x.* ");
		sql.append("FROM shifter.shf_employee_exceptions x ");
		sql.append("WHERE x.agent_day_id = ? ");	//1
		sql.append("AND x.state_type <> ? ");		//2
		sql.append("AND x.source <> 'DEL' ");
		sql.append("AND x.cancel_reason_code IS NULL ");
		
		int param_index = 1;
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param_index++, shiftDayID);	//1
			db.setInteger(param_index++, SHFConstants.STATE_BREAK);		//2
			db.executeQuery();
			while(db.next()){
				ExceptionBean excepInfo = new ExceptionBean();
				db.populate(excepInfo);
				exceptions.add(excepInfo);
			}
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateUserExceptionsNoBreaks() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateUserExceptionsNoBreaks() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return exceptions;
	}
	
	public Vector populateFullDayExceptions() throws ShfException{
		logger.debug("Starting populateFullDayExceptions()");
		Vector vector=new Vector();
		StringBuffer sql=new StringBuffer();
		sql.append("select d.shf_employee_day_id as AGENT_DAY_ID, ");
		sql.append("(24*60) as DURATION, ");
		sql.append("d.wm_date as START_TIME, ");
		sql.append("d.wm_date+1 as END_TIME, ");
		sql.append("d.wm_exception_type_id as EXCEPTION_TYPE, ");
		sql.append("d.source as SOURCE, ");
		sql.append("d.remark as REMARK, ");
		sql.append("3 as STATE_TYPE, ");
		sql.append("1 as FULLDAY, ");
		sql.append("e.employee_id, ");
		sql.append("e.first_name, ");
		sql.append("e.last_name, ");
		sql.append("e.org_unit_id as TEAM, ");
		sql.append("e.Inner_Job_Id as INNER_JOB ");
		sql.append("from shifter.shf_employee_day d ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and nvl(c.new_day_type,d.wm_day_type)=3  ");
		sql.append("and d.wm_date=? ");

		if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
			if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
				sql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = exceptionForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(") ");
			}
			else{
				sql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=exceptionForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getInnerJob()!=null && (!"00".equals(exceptionForm.getInnerJob()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = exceptionForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getExceptionCode()!=null && (!"00".equals(exceptionForm.getExceptionCode()[0]))){
			sql.append("AND d.wm_exception_type_id in (");
			String[] array = exceptionForm.getExceptionCode();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		// Svetlana
		/*if(exceptionForm.getActivity()!=null && (!"00".equals(exceptionForm.getActivity()[0]))){
			sql.append("AND e.emp_id_number in(");
			sql.append("select y.emp_id_number from shifter.shf_employee_skills s ");
			sql.append("left join shifter.shf_employees y on substr(y.emp_id_number,1,8)=s.emp_id_number ");
			sql.append("where y.employee_id>0 and s.skill_id in(");
			sql.append("select t.skill_id from shifter.shf_activity_skill t where t.activity_type_id in(");
			String[] array = exceptionForm.getActivity();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")))");
			
		}*/
		Date date;
		try {
			date = BaseConvert.stringToDate(exceptionForm.getDate(), "dd/MM/yyyy");
		} catch (ConvertException e1) {
			logger.error("error converting string to date: "+e1.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++, date);
			if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
				if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
					
				}
				else{
					db.setString(param++, exceptionForm.getMoked());
					db.setString(param++, exceptionForm.getMoked());
				}
			}
			db.executeQuery();
			db.populate("bzq.shf.bean.ExceptionSearchBean",vector);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateFullDayExceptions(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateFullDayExceptions() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return vector;
	}
	
	
	
	public Vector populateExceptionsList() throws ShfException{
		logger.debug("Starting populateExceptionsList()");
		Vector vector=new Vector();
		StringBuffer sql=new StringBuffer();
		sql.append("select x.*,");
		sql.append("e.employee_id as EMPLOYEE_ID,");
		sql.append("e.first_name as FIRST_NAME,");
		sql.append("e.last_name as LAST_NAME,");
		sql.append("e.org_unit_id as TEAM,");
		sql.append("0 as FULLDAY, ");
		sql.append("e.Inner_Job_Id as INNER_JOB ");
		sql.append("from shifter.shf_employee_exceptions x ");
		sql.append("left join shifter.shf_employee_day d on x.agent_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where  e.employee_id>0 and x.state_type <> 4 and x.state_type > 0 and x.cancel_reason_code is null ");
		sql.append("and x.start_time >= ? and x.start_time <= ? ");
		if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
			if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
				sql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = exceptionForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(") ");
			}
			else{
				sql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=exceptionForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getInnerJob()!=null && (!"00".equals(exceptionForm.getInnerJob()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = exceptionForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getExceptionCode()!=null && (!"00".equals(exceptionForm.getExceptionCode()[0]))){
			sql.append("AND x.EXCEPTION_TYPE in (");
			String[] array = exceptionForm.getExceptionCode();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		// Svetlana
		/*if(exceptionForm.getActivity()!=null && (!"00".equals(exceptionForm.getActivity()[0]))){
			sql.append("AND e.emp_id_number in(");
			sql.append("select y.emp_id_number from shifter.shf_employee_skills s ");
			sql.append("left join shifter.shf_employees y on substr(y.emp_id_number,1,8)=s.emp_id_number ");
			sql.append("where y.employee_id>0 and s.skill_id in(");
			sql.append("select t.skill_id from shifter.shf_activity_skill t where t.activity_type_id in(");
			String[] array = exceptionForm.getActivity();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")))");
			
		}*/
		
		sql.append("");
		Date from=null,to=null;
		try {
			from = BaseConvert.stringToDate(exceptionForm.getDate()+" "+exceptionForm.getTimeFrom(), "dd/MM/yyyy HH:mm");
			to=BaseConvert.stringToDate(exceptionForm.getDate()+" "+exceptionForm.getTimeTo(), "dd/MM/yyyy HH:mm");
		} catch (ConvertException e1) {
			logger.error("error converting string to date: "+e1.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++, from);
			db.setTimestamp(param++, to);
			if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
				if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
					
				}
				else{
					db.setString(param++, exceptionForm.getMoked());
					db.setString(param++, exceptionForm.getMoked());
				}
			}
			db.executeQuery();
			ExceptionSearchBean bean=null;
			while(db.next()){
				bean=new ExceptionSearchBean();
				db.populate(bean);
				if(bean.getStateType()==2){
					bean.setTimeoffType(String.valueOf(bean.getExceptionType()));
					bean.setExceptionType(null);
				}
				vector.add(bean);
			}
			
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateExceptionsList(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateExceptionsList() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return vector;
	}
	
	
	
	public Vector populateTimeoffDays() throws ShfException{
		logger.debug("Starting populateFullDayExceptions()");
		Vector vector=new Vector();
		StringBuffer sql=new StringBuffer();
		sql.append("select d.shf_employee_day_id as AGENT_DAY_ID, ");
		sql.append("(24*60) as DURATION, ");
		sql.append("d.wm_date as START_TIME, ");
		sql.append("d.wm_date+1 as END_TIME, ");
		sql.append("d.wm_timeoff_type_id as TIMEOFF_TYPE, ");
		sql.append("d.source as SOURCE, ");
		sql.append("d.remark as REMARK, ");
		sql.append("2 as STATE_TYPE, ");
		sql.append("1 as FULLDAY, ");
		sql.append("e.employee_id, ");
		sql.append("e.first_name, ");
		sql.append("e.last_name, ");
		sql.append("e.org_unit_id as TEAM, ");
		sql.append("e.Inner_Job_Id as INNER_JOB ");
		sql.append("from shifter.shf_employee_day d ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and nvl(c.new_day_type,d.wm_day_type)=2  ");
		sql.append("and d.wm_date=? ");

		if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
			if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
				sql.append("AND e.ORG_UNIT_ID in( ");
				String[] array = exceptionForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(") ");
			}
			else{
				sql.append("AND (u.PARENT_UNIT = ? OR u.ORG_UNIT_ID = ?) ");
			}
		}else{
			sql.append("AND u.PARENT_UNIT IN (");
			Vector allowed=exceptionForm.getAllowedUnits();
			for(int i=0;i<allowed.size();i++){
				sql.append((String)allowed.get(i));
				if(i<allowed.size()-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getInnerJob()!=null && (!"00".equals(exceptionForm.getInnerJob()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = exceptionForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		if(exceptionForm.getTimeoffCode()!=null && (!"00".equals(exceptionForm.getTimeoffCode()[0]))){
			sql.append("AND d.wm_timeoff_type_id in (");
			String[] array = exceptionForm.getTimeoffCode();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		// Svetlana
		/*if(exceptionForm.getActivity()!=null && (!"00".equals(exceptionForm.getActivity()[0]))){
			sql.append("AND e.emp_id_number in(");
			sql.append("select y.emp_id_number from shifter.shf_employee_skills s ");
			sql.append("left join shifter.shf_employees y on substr(y.emp_id_number,1,8)=s.emp_id_number ");
			sql.append("where y.employee_id>0 and s.skill_id in(");
			sql.append("select t.skill_id from shifter.shf_activity_skill t where t.activity_type_id in(");
			String[] array = exceptionForm.getActivity();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")))");
			
		}*/
		Date date;
		try {
			date = BaseConvert.stringToDate(exceptionForm.getDate(), "dd/MM/yyyy");
		} catch (ConvertException e1) {
			logger.error("error converting string to date: "+e1.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++, date);
			if(((ExceptionSearchForm)exceptionForm).getMoked()!=null && !exceptionForm.getMoked().equals("-1")){
				if(exceptionForm.getTeam()!=null && !exceptionForm.getTeam()[0].equals("00")){
					
				}
				else{
					db.setString(param++, exceptionForm.getMoked());
					db.setString(param++, exceptionForm.getMoked());
				}
			}
			db.executeQuery();
			db.populate("bzq.shf.bean.ExceptionSearchBean",vector);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateFullDayExceptions(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateFullDayExceptions() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return vector;
	}

	public void addRemark() throws ShfException{
		if(employeeExceptionForm.getFullday()==1){
			ShiftDataForm shiftDataForm=new ShiftDataForm();
			shiftDataForm.setUserId(employeeExceptionForm.getUserId());
			shiftDataForm.setUserFirstName(employeeExceptionForm.getUserFirstName());
			shiftDataForm.setUserLastName(employeeExceptionForm.getUserLastName());
			shiftDataForm.setAgentDayId(employeeExceptionForm.getAgentDayId());
			shiftDataForm.setRemark(employeeExceptionForm.getRemark());
			ShiftDataModel shiftDataModel=new ShiftDataModel(shiftDataForm);
			shiftDataModel.saveRemark();
			
		}else{
			try {
				Date start=BaseConvert.stringToDate(employeeExceptionForm.getFrom(), "ddMMyyyyHHmm");
				employeeExceptionForm.setStartTime(start);
			} catch (ConvertException e) {
				logger.error("error occured while convert string to date: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			addExceptionRemark();
		}
		
	}
	
	
	private void addExceptionRemark() throws ShfException{
		logger.info("begin add exception remark");
		StringBuffer sql=new StringBuffer();
		sql.append("update shifter.shf_employee_exceptions t set t.remark=? where t.agent_day_id=? and t.start_time=?");
		DBAccess db=null;
		try{
			db=new DBAccess();
			int param=1;
			db.prepareStatement(sql.toString());
			db.setString(param++, employeeExceptionForm.getRemark());
			db.setLong(param++, employeeExceptionForm.getAgentDayId());
			db.setTimestamp(param++,employeeExceptionForm.getStartTime());
			db.executeUpdate();
		}catch (DBException e) {
			logger.error("error in addExceptionRemark() , agentDayId="+employeeExceptionForm.getAgentDayId()+" startTime="+employeeExceptionForm.getStartTime()+" . "+e.getMessage() );
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateFullDayExceptions() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
}
