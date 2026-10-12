package bzq.shf.model;

import java.util.Date;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.StringTokenizer;
import java.util.Vector;

import org.apache.commons.validator.GenericValidator;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.EmployeeCompletionBean;
import bzq.shf.forms.CTICompletionForm;
import bzq.shf.forms.CTISearchCompletionForm;
import bzq.shf.forms.EmployeeListForm;
import bzq.shf.forms.TableForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.AppResources;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;
import bzq.utils.TablesContainer;

public class CTICompletion {
	
	private CTICompletionForm completionForm;
	private CTISearchCompletionForm searchCompletionForm;
	private Logger logger=Logger.getLogger(CTICompletion.class);
		
	
	
	public CTICompletion(CTICompletionForm form){
		this.completionForm=form;
	}
	
	public CTICompletion(CTISearchCompletionForm form){
		this.searchCompletionForm=form;
	}
	
	public CTICompletion(){
		
	}
	
	public void setViewDefaults() throws ShfException{
		if(searchCompletionForm.getAllowedMoked()!=null){
			searchCompletionForm.setMoked(searchCompletionForm.getAllowedMoked());
			searchCompletionForm.setAgaf(SHFTableUtils.getAgafCodeOf(searchCompletionForm.getMoked()));
		}
		searchCompletionForm.setCompletionFromTime("07:00");
		searchCompletionForm.setCompletionToTime("16:00");
		searchCompletionForm.setSourceSystem(SHFConstants.LOGIN_SYSTEM_COMPLETION);
		searchCompletionForm.setCompletionStatus("");
	}
	
	public String getAllowedMoked(String emp_id_num) throws ShfException {
		EmployeeListForm empForm = new EmployeeListForm();
		empForm.setId_number(emp_id_num);
		empForm.setAllowedUnits(completionForm.getAllowedUnits());
		EmployeeDataModel empDataModel = new EmployeeDataModel(empForm);
		Vector<EmployeeBean> emp = empDataModel.populateEmployeeList();
		if (emp != null)
			return SHFTableUtils.getMokedCodeOf(emp.get(0).getOrgUnitId());
		else 
			throw new ShfException("Error in CTICompletion.getAllowedMoked(), emp returned NULL while populating (no such employee site - profile combination ?)");
	}
	
	public void populateAddedByList() throws ShfException{
		logger.info("start populating added by list.");
		StringBuffer sql=new StringBuffer();
		sql.append("select e.emp_id_number as CODE,e.first_name||' '||e.last_name as DESCRIPTION from shifter.shf_employees e ");
		sql.append("left join shifter.shf_org_unit u on e.org_unit_id = u.org_unit_id ");
		sql.append("WHERE u.org_unit_id in (");
		if(searchCompletionForm.getAllowedUnits()!=null){
			for(int i=0;i<searchCompletionForm.getAllowedUnits().size();i++){
				sql.append(searchCompletionForm.getAllowedUnits().get(i));
				if(i<searchCompletionForm.getAllowedUnits().size()-1)
					sql.append(",");
			}
		}
		sql.append(") AND e.emp_id_number in ");
		sql.append("(select distinct t.update_id from shifter.shf_cti_employee_completions t where t.update_date > sysdate - 365)");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			
			db.executeQuery();
			Vector<TableForm> users=new Vector<TableForm>();
			db.populate("bzq.shf.forms.TableForm", users);
			searchCompletionForm.setUsers(users);
		}catch (DBQueryNoRowsException e){
			searchCompletionForm.setUsers(new Vector<TableForm>());
		}catch (DBException e) {
			logger.error("error in populateAddedByList(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateAddedByList() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public Vector<EmployeeCompletionBean> populate() throws ShfException{
		Vector<EmployeeCompletionBean> completions=null;
		if(searchCompletionForm.getSourceSystem().equals(SHFConstants.LOGIN_SYSTEM_COMPLETION)){
			completions=populateCompletions();
		}else if(searchCompletionForm.getSourceSystem().equals(SHFConstants.LOGIN_SYSTEM_CTI)){
			completions=populateCTI();
		}else{
			completions=populateCompletions();
			Vector<EmployeeCompletionBean> ctiShifts=populateCTI();
			if(completions!=null && ctiShifts!=null){
				completions.addAll(ctiShifts);
			}
			if(completions==null) completions=ctiShifts;
			
		}
		return completions;
	}
	
	public Vector<EmployeeCompletionBean> populateSelectedCompletions() throws ShfException{
		StringBuffer sql=new StringBuffer();
		int param=1;
		Vector<EmployeeCompletionBean> completions=null;
		sql.append("select ");
		sql.append("t.copmletion_seq_code as ID,");
		sql.append("t.completion_code as CODE,");
		sql.append("t.emp_id as EMPLOYEE_ID,");
		sql.append("t.sap_status,");
		sql.append("c.SAP_PAY,");
		sql.append("c.completion_desc as DESCRIPTION,");
		sql.append("e.first_name||' '||e.last_name as EMPLOYEE_NAME,");
		sql.append("e.org_unit_id as TEAM,");
		sql.append("t.copmletion_start as COMPLETION_START,");
		sql.append("t.copmletion_end as COMPLETION_END,");
		sql.append("'SHF' as SOURCE,");
		sql.append("t.update_date,");
		sql.append("t.update_id,");
		sql.append("nvl(s.first_name,t.update_id)||' '||s.last_name as USER_NAME ");
		sql.append("from shifter.shf_cti_employee_completions t ");
		sql.append("left join shifter.shf_cti_completions c on t.completion_code=c.completion_code ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=t.emp_id ");
		sql.append("left join shifter.shf_employees s on s.emp_id_number=t.update_id ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and t.copmletion_seq_code in(");
		for(int i=0;i<searchCompletionForm.getSelectedCompletions().length;i++){
			sql.append(searchCompletionForm.getSelectedCompletions()[i]);
			if(i<searchCompletionForm.getSelectedCompletions().length-1)
				sql.append(",");
		}
		sql.append(")");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			completions=new Vector<EmployeeCompletionBean>();
			db.populate("bzq.shf.bean.EmployeeCompletionBean", completions);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateSelectedCompletions(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateSelectedCompletions() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
		return completions;
	
	}
	
	
	private Vector<EmployeeCompletionBean> getUpdatedCompletions()throws ShfException{
		Vector<EmployeeCompletionBean> vec=new Vector<EmployeeCompletionBean>();
		String[] starts=searchCompletionForm.getCompletionsStart();
		String[] ends=searchCompletionForm.getCompletionsEnd();
		String[] startDates=searchCompletionForm.getCompletionsStartDates();
		String[] endDates=searchCompletionForm.getCompletionsEndDates();
		String[] codes=searchCompletionForm.getCompletionsCodes();
		Integer[] ids=searchCompletionForm.getSelectedCompletions();
		
		if(starts==null || ends==null || codes==null || ids==null || startDates==null || endDates==null){
			logger.error("starts==null || ends==null || codes==null || ids==null || startDates==null || endDates==null");
			throw new ShfException(new ActionError("shf.error.general"));
		}
		
		if(ids.length != starts.length || ids.length!= ends.length || ids.length!= codes.length || ids.length!=startDates.length || ids.length!=endDates.length ){
			logger.error("ids.length != starts.length || ids.length!= ends.length || ids.length!= codes.length || ids.length!=startDates.length || ids.length!=endDates.length");
			throw new ShfException(new ActionError("shf.error.general"));
		}
		
		Date start=null,end=null;
		EmployeeCompletionBean completion=null;
		for(int i=0;i<ids.length;i++){
			completion=new EmployeeCompletionBean();
			try{
				start=BaseConvert.stringToDate(startDates[i]+" "+starts[i],"dd/MM/yyyy HH:mm");
				end=BaseConvert.stringToDate(endDates[i]+" "+ends[i],"dd/MM/yyyy HH:mm");
			}catch (ConvertException e) {
				logger.error("cannot convert from starting to date: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
			completion.setId(ids[i]);
			completion.setCode(codes[i]);
			completion.setCompletionStart(start);
			completion.setCompletionEnd(end);
			
			vec.add(completion);
		}
		return vec;
	}
	
	
	public Vector update(HashSet<String> set) throws ShfException{
		logger.info("beginning updating completions");
		Vector errors=null;
		//get vector of employeeCompletions by input arrays
		Vector<EmployeeCompletionBean> completions=getUpdatedCompletions();
		DBAccess db=null;
		try{
			db=new DBAccess();
			errors=new Vector();
			for (EmployeeCompletionBean completion : completions) {
				
				
				try{
					checkEmployeeCompletionTime(completion);
					checkEmployeeCompletionForUpdate(db,completion);
					updateEmployeeCompletion(db,completion);
				}catch (ShfException e) {
					if(e.getErrors()!=null && e.getErrors().size()>0){
						ActionError error=(ActionError)e.getErrors().get().next();
						set.add(error.getKey());
					}
					errors.add(completion);
				}
			}
			
			if(errors!=null && errors.size()>0){
				try {
					db.rollback();
				} catch (DBException e) {
					logger.error("error in saveCompletions() while rollback db connection: "+e.getMessage());
					throw new ShfException(new ActionError("shf.error.general"));
				}
			}else{
				try {
					db.commit();
				} catch (DBException e) {
					logger.error("error in saveCompletions() while commit db connection: "+e.getMessage());
					throw new ShfException(new ActionError("shf.error.general"));
				}
			}
		}catch (Exception e) {
			
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in saveCompletions() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
		return errors;
	}
	
	
	
	private void updateEmployeeCompletion(DBAccess db,EmployeeCompletionBean completionBean)throws ShfException {
		logger.info("beginning updateEmployeeCompletion "+completionBean.getId());
		StringBuffer sql=new StringBuffer();
		sql.append("update SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS t SET ");
		sql.append("t.COPMLETION_START = ? , ");
		sql.append("t.COPMLETION_END = ? , ");
		sql.append("t.COMPLETION_CODE = ? , ");
		sql.append("t.UPDATE_DATE = ? , ");
		sql.append("t.UPDATE_ID = ?  ");
		sql.append("WHERE t.COPMLETION_SEQ_CODE = ? ");
		sql.append("AND( ");
		sql.append("t.COPMLETION_START <> ? ");
		sql.append("OR t.COPMLETION_END <> ? ");
		sql.append("OR t.COMPLETION_CODE <> ? )");
		int param=1;
		try{
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setString(param++,completionBean.getCode());
			db.setTimestamp(param++,new Date());
			db.setString(param++,searchCompletionForm.getUserId());
			db.setInt(param++,completionBean.getId());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setString(param++,completionBean.getCode());
			
			db.executeUpdate();
		}catch (DBUpdateNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error while adding completion to "+completionBean.getEmployeeIdNumber()+".  "+e.getMessage());
			throw new ShfException("shf.error.general");
		}
	}

	private void checkEmployeeCompletionForUpdate(DBAccess db,EmployeeCompletionBean completionBean)throws ShfException {
		logger.info("check if the updated completion conflicts with other one.");
		StringBuffer sql=new StringBuffer();
		sql.append("select * from shifter.shf_cti_employee_completions t ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=t.emp_id ");
		sql.append("where substr(e.emp_id_number,1,8)=(select s.emp_id from shifter.shf_cti_employee_completions s where s.copmletion_seq_code=? ) ");
		sql.append("and t.copmletion_seq_code <> ? ");
		sql.append("and( ");
		sql.append("(t.copmletion_start <= ? and t.copmletion_end > ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start < ? and t.copmletion_end >= ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start >= ? and t.copmletion_end <= ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start <= ? and t.copmletion_end >= ?) ");
		sql.append(") ");
		
		int param=1;
		try{
			db.prepareStatement(sql.toString());
			db.setInt(param++,completionBean.getId());
			db.setInt(param++,completionBean.getId());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.executeQuery();
			logger.error("employee "+completionBean.getEmployeeId()+" has another completion in this time");
			throw new ShfException(new ActionError("shf.error.completionConflict"));
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e){
			logger.error("error in checkEmployeeCompletion to "+completionBean.getEmployeeId()+".  "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}
	}
	
	
	
	

	public void cancel() throws ShfException{
		logger.info("beginning of canceling completions");
		StringBuffer sql=new StringBuffer();
		sql.append("update shifter.shf_cti_employee_completions t set ");
		sql.append("t.sap_status = ? ");
		sql.append("where t.COPMLETION_SEQ_CODE in (");
		for(int i=0;i<searchCompletionForm.getSelectedCompletions().length;i++){
			sql.append(searchCompletionForm.getSelectedCompletions()[i]);
			if(i<searchCompletionForm.getSelectedCompletions().length-1)
				sql.append(",");
		}
		sql.append(")");
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1, SHFConstants.COMPLETION_STATUS_CANCELED);
			db.executeUpdate();
		}catch (DBUpdateNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in cancel(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in cancel() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	
	
	private Vector<EmployeeCompletionBean> populateCTI() throws ShfException{
		Vector<EmployeeCompletionBean> ctiShifts=null;
		int param=1;
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT ");
		sql.append("t.cti_shift_id as ID, ");
		sql.append("t.emp_id as EMPLOYEE_ID, ");
		sql.append("t.sap_status, ");
		sql.append("e.first_name||' '||e.last_name as EMPLOYEE_NAME, ");
		sql.append("e.org_unit_id as TEAM, ");
		sql.append("t.cti_shift_start as COMPLETION_START, ");
		sql.append("t.cti_shift_end as COMPLETION_END, ");
		sql.append("'CTI' as SOURCE, ");
		sql.append("'ETL' as USER_NAME,");
		sql.append("t.update_date ");
		sql.append("FROM shifter.shf_cti_shifts t ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=t.emp_id ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 and rownum<=500 ");
		sql.append("and nvl(t.cti_shift_start,t.cti_shift_end) between ? and ? ");
	    if(!GenericValidator.isBlankOrNull(searchCompletionForm.getFirstName()))
			sql.append("and e.first_name like ?||'%' ");
		if(!GenericValidator.isBlankOrNull(searchCompletionForm.getLastName()))
			sql.append("and e.last_name like ?||'%' ");
		if(!GenericValidator.isBlankOrNull(searchCompletionForm.getId_number()))
			sql.append("and e.emp_id_number = ? ");
		
		//////
		StringTokenizer st=new StringTokenizer(searchCompletionForm.getCompletionStatus(),",");
		if(st.hasMoreTokens()){
			sql.append("and t.sap_status in (");
				while(st.hasMoreTokens()){
					sql.append(st.nextToken());
					if(st.hasMoreTokens())
						sql.append(",");
				}
		    sql.append(")");
		}
	    //////
		
		if(searchCompletionForm.getMoked()!=null && !searchCompletionForm.getMoked().equals("-1")){
			if(searchCompletionForm.getTeam()!=null && !searchCompletionForm.getTeam().equals("-1")){
				sql.append("AND e.ORG_UNIT_ID = ? ");
			}else{
				sql.append("AND (u.ORG_UNIT_ID = ? or u.PARENT_UNIT = ?) ");
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND u.PARENT_UNIT IN (" );
			  Vector allowedUnits = searchCompletionForm.getAllowedUnits();
			  Iterator  it = allowedUnits.iterator();
			  while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
					unitSelect.append(","); 
			  } 
			  unitSelect.append(" )");
			  sql.append(unitSelect);
		}
		sql.append("order by t.cti_shift_start");
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			try{
			    db.setTimestamp(param++,BaseConvert.stringToDate(searchCompletionForm.getCompletionFromDate()+" "+searchCompletionForm.getCompletionFromTime(),"dd/MM/yyyy HH:mm"));
			    db.setTimestamp(param++,BaseConvert.stringToDate(searchCompletionForm.getCompletionToDate()+" "+searchCompletionForm.getCompletionToTime(),"dd/MM/yyyy HH:mm"));
		    }catch (ConvertException e) {
				logger.error("error converting string to date: " +e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		    if(!GenericValidator.isBlankOrNull(searchCompletionForm.getFirstName()))
				db.setString(param++,searchCompletionForm.getFirstName());
			if(!GenericValidator.isBlankOrNull(searchCompletionForm.getLastName()))
				db.setString(param++,searchCompletionForm.getLastName());
			if(!GenericValidator.isBlankOrNull(searchCompletionForm.getId_number()))
				db.setString(param++,searchCompletionForm.getId_number());
			
			if(searchCompletionForm.getMoked()!=null && !searchCompletionForm.getMoked().equals("-1")){
				if(searchCompletionForm.getTeam()!=null && !searchCompletionForm.getTeam().equals("-1")){
					db.setString(param++, searchCompletionForm.getTeam());
				}else{
					db.setString(param++, searchCompletionForm.getMoked());
					db.setString(param++, searchCompletionForm.getMoked());
				}
			}
			db.executeQuery();
			ctiShifts=new Vector<EmployeeCompletionBean>();
			db.populate("bzq.shf.bean.EmployeeCompletionBean",ctiShifts);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateCTI(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateCTI() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
		return ctiShifts;
	}
	
	private Vector<EmployeeCompletionBean> populateCompletions() throws ShfException{
		StringBuffer sql=new StringBuffer();
		int param=1;
		Vector<EmployeeCompletionBean> completions=null;
		sql.append("select ");
		sql.append("t.copmletion_seq_code as ID,");
		sql.append("t.completion_code as CODE,");
		sql.append("t.emp_id as EMPLOYEE_ID,");
		sql.append("t.sap_status,");
		sql.append("c.SAP_PAY,");
		sql.append("c.completion_desc as DESCRIPTION,");
		sql.append("e.first_name||' '||e.last_name as EMPLOYEE_NAME,");
		sql.append("e.org_unit_id as TEAM,");
		sql.append("t.copmletion_start as COMPLETION_START,");
		sql.append("t.copmletion_end as COMPLETION_END,");
		sql.append("'SHF' as SOURCE,");
		sql.append("t.update_date,");
		sql.append("t.update_id,");
		sql.append("nvl(s.first_name,t.update_id)||' '||s.last_name as USER_NAME ");
		sql.append("from shifter.shf_cti_employee_completions t ");
		sql.append("left join shifter.shf_cti_completions c on t.completion_code=c.completion_code ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=t.emp_id ");
		sql.append("left join shifter.shf_employees s on s.emp_id_number=t.update_id ");
		sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
		sql.append("where e.employee_id>0 ");
		if(!GenericValidator.isBlankOrNull(searchCompletionForm.getFirstName()))
			sql.append("and e.first_name like ?||'%' ");
		if(!GenericValidator.isBlankOrNull(searchCompletionForm.getLastName()))
			sql.append("and e.last_name like ?||'%' ");
		if(!GenericValidator.isBlankOrNull(searchCompletionForm.getId_number()))
			sql.append("and e.emp_id_number = ? ");
		
		//////
		StringTokenizer st=new StringTokenizer(searchCompletionForm.getCompletionStatus(),",");
		if(st.hasMoreTokens()){
			sql.append("and t.sap_status in (");
				while(st.hasMoreTokens()){
					sql.append(st.nextToken());
					if(st.hasMoreTokens())
						sql.append(",");
				}
		    sql.append(")");
		}
	    ///////
	    
	    if(!("00".equals(searchCompletionForm.getCompletionCode())))
	    	sql.append("and t.completion_code=? ");
	    if(!GenericValidator.isBlankOrNull(searchCompletionForm.getUpdatingUser()))
	    	sql.append("and t.update_id=? ");
	    sql.append("and t.copmletion_start between ? and ? ");
	    if(searchCompletionForm.getMoked()!=null && !searchCompletionForm.getMoked().equals("-1")){
			if(searchCompletionForm.getTeam()!=null && !searchCompletionForm.getTeam().equals("-1")){
				sql.append("AND e.ORG_UNIT_ID = ? ");
			}else{
				sql.append("AND (u.ORG_UNIT_ID = ? or u.PARENT_UNIT = ?) ");
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND u.PARENT_UNIT IN (" );
			  Vector allowedUnits = searchCompletionForm.getAllowedUnits();
			  Iterator  it = allowedUnits.iterator();
			  while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
					unitSelect.append(","); 
			  } 
			  unitSelect.append(" )");
			  sql.append(unitSelect);
		}
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			if(!GenericValidator.isBlankOrNull(searchCompletionForm.getFirstName()))
				db.setString(param++,searchCompletionForm.getFirstName());
			if(!GenericValidator.isBlankOrNull(searchCompletionForm.getLastName()))
				db.setString(param++,searchCompletionForm.getLastName());
			if(!GenericValidator.isBlankOrNull(searchCompletionForm.getId_number()))
				db.setString(param++,searchCompletionForm.getId_number());
		   	
		    	
		    if(!("00".equals(searchCompletionForm.getCompletionCode())))
		    	db.setString(param++,searchCompletionForm.getCompletionCode());
		    if(!GenericValidator.isBlankOrNull(searchCompletionForm.getUpdatingUser()))
		    	db.setString(param++,searchCompletionForm.getUpdatingUser());
		    try{
			    db.setTimestamp(param++,BaseConvert.stringToDate(searchCompletionForm.getCompletionFromDate()+" "+searchCompletionForm.getCompletionFromTime(),"dd/MM/yyyy HH:mm"));
			    db.setTimestamp(param++,BaseConvert.stringToDate(searchCompletionForm.getCompletionToDate()+" "+searchCompletionForm.getCompletionToTime(),"dd/MM/yyyy HH:mm"));
		    }catch (ConvertException e) {
				logger.error("error converting string to date: " +e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		    if(searchCompletionForm.getMoked()!=null && !searchCompletionForm.getMoked().equals("-1")){
				if(searchCompletionForm.getTeam()!=null && !searchCompletionForm.getTeam().equals("-1")){
					db.setString(param++, searchCompletionForm.getTeam());
				}else{
					db.setString(param++, searchCompletionForm.getMoked());
					db.setString(param++, searchCompletionForm.getMoked());
				}
			}
		    db.executeQuery();
			completions=new Vector<EmployeeCompletionBean>();
			db.populate("bzq.shf.bean.EmployeeCompletionBean", completions);
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in populateCompletions(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateCompletions() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
		return completions;
	}
	
	public void setAddDefaults(){
		if(completionForm.getAllowedMoked()!=null){
			completionForm.setMoked(completionForm.getAllowedMoked());
			completionForm.setAgaf(SHFTableUtils.getAgafCodeOf(completionForm.getMoked()));
		}
		completionForm.setPersonalData(true);
		completionForm.setUnitData(true);
		completionForm.setShiftData(true);
		completionForm.setByShiftStart(true);
		completionForm.setByShiftEnd(false);
		completionForm.setByShiftActivity(false);
		completionForm.setStatusId(3);
		
	}

	public Vector populateCompletionResult(Integer[] selectedEmployees, String ctiSingleMokedUnitId) throws ShfException {
		logger.info("beginning populateCompletionResult()");
		checkCompletion();
		if(completionForm.isShiftData()){
			return populateByShiftsData(selectedEmployees, ctiSingleMokedUnitId);
		}else{
			return populateByEmployeeData();
		}
		
	}
	
	private Vector populateByShiftsData(Integer[] selectedEmployees, String ctiSingleMokedUnitId) throws ShfException{
		logger.info("beginning populateByShiftsData()");
		Vector shifts=null;
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
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where rownum<=500 AND e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? "); // 1
		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ?  "); // 2
		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) <  ?+1 "); // 3
		if(completionForm.isByShiftStart()){
			sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) between ? AND  ? "); // 4+5
		}
		if(completionForm.isByShiftEnd()){
			sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) between ? AND  ? "); // 6+7
		}
		
		if(completionForm.isUnitData() || ctiSingleMokedUnitId != null){
			if (completionForm.isUnitData()) {
				if(completionForm.getMoked()!=null && !completionForm.getMoked().equals("-1")){
					if((completionForm.getTeam() != null) && ( ! completionForm.getTeam()[0].equals("-1"))){ // Bug fix, original code .equals("00") Igal 7.2013
						sql.append("AND e.ORG_UNIT_ID in( ");
						String[] array = completionForm.getTeam();
						for(int i=0;i<array.length;i++){
							sql.append(array[i]);
							if(i<array.length-1) sql.append(",");
						}
						sql.append(") ");
					}else{
						sql.append("AND u.PARENT_UNIT = ? "); // 8
					}
				}
				else{
					  StringBuffer unitSelect = new StringBuffer("");
					  unitSelect.append("AND u.PARENT_UNIT IN (" );
					  Vector allowedUnits = completionForm.getAllowedUnits();
					  Iterator  it = allowedUnits.iterator();
					  while (it.hasNext()) {
						unitSelect.append( it.next()); 
						if (it.hasNext()) 
							unitSelect.append(","); 
					  } 
					  unitSelect.append(" )");
					  sql.append(unitSelect);
				}
				if(!"00".equals(completionForm.getJob()) && completionForm.getJob()!= null){
					sql.append("AND e.JOB_ID = ? "); // 9
				}
				if(completionForm.getStatusId()>0){
					sql.append("AND e.status_id = ? "); //10
				}
			} else {
				sql.append("AND u.PARENT_UNIT = ? "); // 8
			}
		}
		if(completionForm.isPersonalData()){
			if(!GenericValidator.isBlankOrNull(completionForm.getFirst_name())){
				sql.append("AND e.FIRST_NAME like ?||'%' "); // 11
			}
			if(!GenericValidator.isBlankOrNull(completionForm.getLast_name())){
				sql.append("AND e.LAST_NAME like ?||'%' "); // 12
			}
			if(!GenericValidator.isBlankOrNull(completionForm.getId_number())){
				sql.append("AND e.EMP_ID_NUMBER = ? "); // 13
			}
		}
		
		if(selectedEmployees!=null){
			sql.append(" AND e.employee_id in (");
			for(int i=0;i<selectedEmployees.length;i++){
				sql.append(selectedEmployees[i]);
				if(i<selectedEmployees.length-1) sql.append(",");
			}
			sql.append(") ");
		}
		
		sql.append(" ORDER BY d.wm_shift_start_datetime,e.FIRST_NAME,e.LAST_NAME");
		logger.debug(sql.toString());
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY); //1
			try {
				db.setDate(param++,BaseConvert.stringToDate(completionForm.getShiftDate(),"dd/MM/yyyy")); // 2
				db.setDate(param++,BaseConvert.stringToDate(completionForm.getShiftDate(),"dd/MM/yyyy")); // 3
				if(completionForm.isByShiftStart()){
					db.setTimestamp(param++,BaseConvert.stringToDate(completionForm.getShiftDate()+" "+completionForm.getShiftStartFrom(),"dd/MM/yyyy HH:mm")); //4
					db.setTimestamp(param++,BaseConvert.stringToDate(completionForm.getShiftDate()+" "+completionForm.getShiftStartTo(),"dd/MM/yyyy HH:mm")); // 5
				}
				if(completionForm.isByShiftEnd()){
					db.setTimestamp(param++,BaseConvert.stringToDate(completionForm.getShiftDate()+" "+completionForm.getShiftEndFrom(),"dd/MM/yyyy HH:mm")); // 6
					db.setTimestamp(param++,BaseConvert.stringToDate(completionForm.getShiftDate()+" "+completionForm.getShiftEndTo(),"dd/MM/yyyy HH:mm")); // 7
				}
				
			} catch (ConvertException e) {
				logger.error("error converting shift date. ",e);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
				throw new ShfException(actionErrors);
			}
			
			if(completionForm.isUnitData() || ctiSingleMokedUnitId != null){
				if (completionForm.isUnitData()) {
					if(completionForm.getMoked()!=null && !completionForm.getMoked().equals("-1")){
						if(completionForm.getTeam()!=null && !completionForm.getTeam()[0].equals("-1")){ // Bug fix, original code .equals("00") Igal 7.2013
							//db.setString(param,completionForm.getTeam());
						}else{
							db.setString(param++,completionForm.getMoked()); // 8
						}
					//	param++;
					}
					
					if(!"00".equals(completionForm.getJob()) && completionForm.getJob()!= null){
						db.setString(param,completionForm.getJob()); // 9
						param++;
					}
					if(completionForm.getStatusId()>0){
						db.setInt(param++,completionForm.getStatusId()); // 10
					}
				} else {
					db.setString(param++,ctiSingleMokedUnitId); // 8
				}
			}
			if(completionForm.isPersonalData()){
				if(!GenericValidator.isBlankOrNull(completionForm.getFirst_name())){
					db.setString(param++,completionForm.getFirst_name()); // 11 
				}
				if(!GenericValidator.isBlankOrNull(completionForm.getLast_name())){ 
					db.setString(param++,completionForm.getLast_name()); // 12
				}
				if(!GenericValidator.isBlankOrNull(completionForm.getId_number())){
					db.setString(param++,completionForm.getId_number()); // 13
				}
			}
			
			db.executeQuery();
			logger.info("cti: populateByShiftsData after execute query.");
			shifts=new Vector();
			AgentDayBean day=null;
			while(db.next()){
				day=new AgentDayBean();
				db.populate(day);
				if(completionForm.isByShiftActivity() && completionForm.getActivity()!=null && !("00".equals(completionForm.getActivity()))){
					if(SHFTableUtils.isActivitiesEquals(day.getShiftActivity(),completionForm.getActivity())){
						shifts.add(day);
					}
				}
				else{
					shifts.add(day);
				}
			}
			
			
			
		}catch(DBQueryNoRowsException e){
			logger.info("no rows in populateByShiftsData()");
		} catch (DBException e) {
			logger.error("error in populateShiftList(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateShiftList() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return shifts;
	}
	
	private Vector populateByEmployeeData() throws ShfException {
		logger.info("beginning populateByEmployeeData()");
		EmployeeListForm employeeListForm=new EmployeeListForm();
		
		employeeListForm.setAllowedUnits(completionForm.getAllowedUnits());
		if(completionForm.isUnitData()){
			employeeListForm.setMoked(completionForm.getMoked());
			employeeListForm.setTeam(completionForm.getTeam());
			employeeListForm.setJob(completionForm.getJob());
			employeeListForm.setStatus(completionForm.getStatusId());
		}
		if(completionForm.isPersonalData()){
			employeeListForm.setFirst_name(completionForm.getFirst_name());
			employeeListForm.setLast_name(completionForm.getLast_name());
			employeeListForm.setId_number(completionForm.getId_number());
			employeeListForm.setStatus(completionForm.getStatusId());
		}
		
		EmployeeDataModel employee=new EmployeeDataModel(employeeListForm);
		Vector employeeList=employee.populateEmployeeList();
		return employeeList;
	}
	
	private void checkCompletion() throws ShfException{
		
		try{
			Date start=BaseConvert.stringToDate(completionForm.getCompletionFromDate()+" "+completionForm.getCompletionStart(), "dd/MM/yyyy HH:mm");
			Date end=BaseConvert.stringToDate(completionForm.getCompletionToDate()+" "+completionForm.getCompletionEnd(), "dd/MM/yyyy HH:mm");		
			
			completionForm.setStart(start);
			completionForm.setEnd(end);
			
			if(!(end.after(start))){
				throw new ShfException(new ActionError("shf.error.completionEndBeforeStart"));
			}
			int maxLength=Integer.parseInt(SHFParameters.getMaxCompletionLength(null).getValue());
			
			long length=SHFUtils.getMinutesBetweenLong(start, end);
			if(length>maxLength){
				throw new ShfException(new ActionError("shf.error.highCompletionDuration"));
			}
			
		}catch (ConvertException e) {
			logger.error("error in checkCompletion: "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}
	}
	
	private Hashtable<Integer, EmployeeCompletionBean> getEmployeesCompletions() throws ShfException{
		Hashtable<Integer,EmployeeCompletionBean> employees=null;
		Integer[] employeeIds=completionForm.getSelectedEmployees();
		String[] completionsStart=completionForm.getCompletionsStart();
		String[] completionsEnd=completionForm.getCompletionsEnd();
		if(employeeIds==null || completionsStart==null || completionsEnd==null){
			logger.error("employeeNumbers==null || completionsStart==null || completionsEnd==null");
			throw new ShfException(new ActionError("shf.error.general"));
		}
		if(employeeIds.length != completionsStart.length || employeeIds.length != completionsEnd.length){
			logger.error("employeeNumbers==null || completionsStart==null || completionsEnd==null");
			throw new ShfException(new ActionError("shf.error.general"));
		}
		employees=new Hashtable<Integer,EmployeeCompletionBean>();
		EmployeeCompletionBean completionBean=null;
		for(int i=0;i<employeeIds.length;i++){
			completionBean=new EmployeeCompletionBean();
			completionBean.setEmployeeId(employeeIds[i]);
			try{
				completionBean.setCompletionStart(BaseConvert.stringToDate(completionForm.getCompletionFromDate()+" "+completionsStart[i],"dd/MM/yyyy HH:mm"));
				completionBean.setCompletionEnd(BaseConvert.stringToDate(completionForm.getCompletionToDate()+" "+completionsEnd[i],"dd/MM/yyyy HH:mm"));
			}catch (ConvertException e) {
				logger.error("error converting string to date: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
			employees.put(employeeIds[i], completionBean);
		}
		return employees;
	}
	
	public Vector saveCompletions(HashSet<String> set) throws ShfException{
		Hashtable<Integer,EmployeeCompletionBean> employees=getEmployeesCompletions();
		Vector errors=new Vector();
		
		if(employees!=null && employees.size()>0){
			DBAccess db=null;
			try{
				db=new DBAccess(false);
				EmployeeBean employee=null;
				Integer empid=null;
				Iterator<Integer> iterator = (Iterator<Integer>)employees.keys();
				EmployeeCompletionBean completion=null;
				while(iterator.hasNext()){
					empid=iterator.next();
					completion=employees.get(empid);
					
					try{
						
						saveEmployeeCompletion(db,completion);
					}catch (ShfException e) {
						if(e.getErrors()!=null && e.getErrors().size()>0){
							ActionError error=(ActionError)e.getErrors().get().next();
							set.add(error.getKey());
						}
						errors.add(empid);
					}
				}
				
				/////	
				
			}finally{
				if(errors!=null && errors.size()>0){
					try {
						db.rollback();
					} catch (DBException e) {
						logger.error("error in saveCompletions() while rollback db connection: "+e.getMessage());
						throw new ShfException(new ActionError("shf.error.general"));
					}
				}else{
					try {
						db.commit();
					} catch (DBException e) {
						logger.error("error in saveCompletions() while commit db connection: "+e.getMessage());
						throw new ShfException(new ActionError("shf.error.general"));
					}
				}
				try {
					db.close();
				} catch (DBException e) {
					logger.error("error in saveCompletions() while closing db connection: "+e.getMessage());
					throw new ShfException(new ActionError("shf.error.general"));
				}
			}
		}
		return errors;
	}
	
	private void checkEmployeeCompletionTime(EmployeeCompletionBean completionBean) throws ShfException{
		if(!(completionBean.getCompletionEnd().after(completionBean.getCompletionStart()))){
			throw new ShfException(new ActionError("shf.error.completionEndBeforeStart"));
		}
		int maxLength=Integer.parseInt(SHFParameters.getMaxCompletionLength(null).getValue());
		int length=SHFUtils.getMinutesBetween(completionBean.getCompletionStart(), completionBean.getCompletionEnd());
		if(length>maxLength){
			throw new ShfException(new ActionError("shf.error.highCompletionDuration"));
		}
	}
	
	private void saveEmployeeCompletion(DBAccess db,EmployeeCompletionBean completionBean) throws ShfException{
		
		checkEmployeeCompletionTime(completionBean);
		checkEmployeeCompletion(db,completionBean);
		
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO shifter.shf_cti_employee_completions");
		sql.append("(COPMLETION_SEQ_CODE,EMP_ID,COMPLETION_CODE,COPMLETION_START,COPMLETION_END,SAP_STATUS,UPDATE_DATE,UPDATE_ID) ");
		sql.append("VALUES(SHIFTER.SHF_CTI_COPLETION_ID.NEXTVAL,(select substr(e.emp_id_number,1,8) from shifter.shf_employees e where e.employee_id=?),?,?,?,0,sysdate,?)");
		int param=1;
		try{
			db.prepareStatement(sql.toString());
			db.setInt(param++,completionBean.getEmployeeId());
			db.setString(param++,completionForm.getCompletionCode());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setString(param++,completionForm.getUserId());
			db.executeUpdate();
		}catch (DBException e) {
			logger.error("error while adding completion to "+completionBean.getEmployeeIdNumber()+".  "+e.getMessage());
			throw new ShfException("shf.error.general");
		}
	}
	
	private void checkEmployeeCompletion(DBAccess db,EmployeeCompletionBean completionBean) throws ShfException{
		StringBuffer sql=new StringBuffer();
		sql.append("select * from shifter.shf_cti_employee_completions t ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=t.emp_id ");
		sql.append("where e.employee_id=? ");
		sql.append("and t.sap_status <> ? ");
		sql.append("and( ");
		sql.append("(t.copmletion_start <= ? and t.copmletion_end > ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start < ? and t.copmletion_end >= ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start >= ? and t.copmletion_end <= ?) ");
		sql.append("or ");
		sql.append("(t.copmletion_start <= ? and t.copmletion_end >= ?) ");
		sql.append(") ");
		
		int param=1;
		try{
			db.prepareStatement(sql.toString());
			db.setInt(param++,completionBean.getEmployeeId());
			db.setInt(param++, SHFConstants.COMPLETION_STATUS_CANCELED);
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.setTimestamp(param++,completionBean.getCompletionStart());
			db.setTimestamp(param++,completionBean.getCompletionEnd());
			db.executeQuery();
			logger.error("employee "+completionBean.getEmployeeId()+" has another completion in this time");
			throw new ShfException(new ActionError("shf.error.completionConflict"));
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e){
			logger.error("error in checkEmployeeCompletion to "+completionBean.getEmployeeId()+".  "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}
	}
	
	
	public Vector<TableForm> getJobs(Vector<TableForm> available) throws ShfException{
		Vector<TableForm> assigned=new Vector<TableForm>();
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
		Vector allJobs = tablesContainer.getTable("jobCode");
		Vector<String> tmp=getAssignedJobsToSap();
		TableForm job=null;
		for(int i=0;i<allJobs.size();i++){
			job=(TableForm)allJobs.get(i);
			if(tmp.contains(job.getCode())){
				assigned.add(job);
			}else{
				available.add(job);
			}
		}
		return assigned;
	}
	
	private Vector<String> getAssignedJobsToSap() throws ShfException{
		Vector<String> assigned=new Vector<String>();
		String sql="select * from shifter.shf_cti_job_to_sap t";
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql);
			db.executeQuery();
			while(db.next()){
				assigned.add(db.getString(1));
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error("error in getAssignedJobsToSap(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in getAssignedJobsToSap() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
		return assigned;
	}

	public void assignJob(TableForm job) throws ShfException {
		String sql="insert into shifter.shf_cti_job_to_sap(JOB_ID) values(?)";
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(1,job.getCode());
			db.executeUpdate();
		}catch (DBException e) {
			logger.error("error in assignJob(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in assignJob() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	
	public void unAssignJob(TableForm job) throws ShfException {
		String sql="delete from shifter.shf_cti_job_to_sap t where t.JOB_ID=?";
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(1,job.getCode());
			db.executeUpdate();
		}catch (DBException e) {
			logger.error("error in assignJob(): "+e.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in assignJob() while closing db connection: "+e.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
		}
	}
	
}
