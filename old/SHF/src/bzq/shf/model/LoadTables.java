/*
 * Created on 31/07/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.log4j.Logger;

import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.forms.TableForm;
import bzq.forms.TableInfo;
import bzq.shf.bean.CompletionBean;
import bzq.shf.bean.ExceptionActivityBean;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.bean.TimeoffBean;
import bzq.shf.forms.ActivityForm;
import bzq.shf.forms.EventReasonForm;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.utils.CodeTable;
import bzq.shf.utils.ComplexCodeTable;
import bzq.shf.utils.TablesConstants;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class LoadTables {
	
	private static Logger logger = Logger.getLogger(LoadTables.class);
	
	private bzq.utils.TablesContainer tablesContainer;
	
	/**
	 * @param tablesContainer
	 */
	public LoadTables(TablesContainer tablesContainer) {
		this.tablesContainer= tablesContainer;
	}

	/**
	 * @param string
	 */
	public void load(String tableName) throws DBException{
		
		logger.info("beginning load table "+tableName);
		
		if (tableName.equals(TablesConstants.JOB_TABLE)){
			loadJobs();	
		}
		if (tableName.equals(TablesConstants.UNIT_TABLE)){
			loadOrgUnit();	
		}
		if (tableName.equals(TablesConstants.SITE_UNIT_TABLE)){
			loadSiteUnitTable();	
		}
		if (tableName.equals(TablesConstants.ACTIVITY_TABLE)){
			loadActivities();	
		}
		if (tableName.equals(TablesConstants.EVENT_REASON_TABLE)){
			loadEventReasons();	
		}
		if (tableName.equals(TablesConstants.SKILL_TABLE)){
			loadSkills();	
		}
		if (tableName.equals(TablesConstants.SYSTEM_PARAM)){
			loadParameters();	
		}
		if(tableName.equals(TablesConstants.EXCEPTION_TABLE)){
			loadExceptions();
		}
		if(tableName.equals(TablesConstants.VIRTUAL_ACTIVITY)){
			loadVirtualActivities();
		}
		if(tableName.equals(TablesConstants.COMPLETION_TABLE)){
			loadCompletions();
		}
		if(tableName.equals(TablesConstants.INNER_JOB_TABLE)){
			loadInnerJobs();
		}
		if(tableName.equals(TablesConstants.TIMEOFF_TABLE)){
			loadTimeoffTypes();
		}
		if(tableName.equals(TablesConstants.CATEGORY_JOB)){
			loadCategoryJobTable();
		}
		if(tableName.equals(TablesConstants.MOBILE_AUDIT_REF)){
			loadMobileAuditRef();
		}
		
	}
	
	
	public void loadTimeoffTypes() throws DBException{
		logger.debug("Starting loadTimeoffTypes()");
		
		TimeoffBean tableForm=new TimeoffBean();
		tableForm.setCode("00");
		tableForm.setDescription("הכל");
		tablesContainer.setTableAll(TablesConstants.TIMEOFF_TABLE,tableForm);
		ComplexCodeTable timeoffTable = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.TIMEOFF_TABLE,timeoffTable.getTimeoffTypes());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadInnerJobs() throws DBException{
		logger.debug("Starting loadCompletions()");
		InnerJobBean tableForm=new InnerJobBean();
		tableForm.setCode("00");
		tableForm.setDescription("");
		tablesContainer.setTableEmptySelection(TablesConstants.INNER_JOB_TABLE,tableForm);
		ComplexCodeTable innerJobsTable = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.INNER_JOB_TABLE,innerJobsTable.getInnerJobs());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadCompletions() throws DBException{
		logger.debug("Starting loadCompletions()");
		CompletionBean tableForm=new CompletionBean();
		tableForm.setCode("00");
		tableForm.setDescription("הכל");
		tablesContainer.setTableAll(TablesConstants.COMPLETION_TABLE,tableForm);
		ComplexCodeTable completionsTable = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.COMPLETION_TABLE,completionsTable.getCompletions());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadExceptions() throws DBException{
		logger.debug("Starting loadExceptions()");
		
		ExceptionActivityBean tableForm=new ExceptionActivityBean();
		tableForm.setCode("00");
		tableForm.setDescription("הכל");
		tablesContainer.setTableAll(TablesConstants.EXCEPTION_TABLE,tableForm);
		ComplexCodeTable exceptionsTable = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.EXCEPTION_TABLE,exceptionsTable.getExceptionTypes());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadMobileAuditRef() throws DBException {
		logger.debug("Starting loadMobileAuditRef()");
		
		ComplexCodeTable mobileAuditRefParam = new ComplexCodeTable();
		tablesContainer.setTable(TablesConstants.MOBILE_AUDIT_REF,mobileAuditRefParam.getMobileAuditRef());	
		
	}
	public void loadParameters() throws DBException {
		logger.debug("Starting loadParameters()");
		
		ComplexCodeTable systemParam = new ComplexCodeTable();
		try {
			tablesContainer.setTable(TablesConstants.SYSTEM_PARAM,systemParam.getSystemParameters());	
		} catch (DBQueryNoRowsException e) {}
	}

	public void loadSiteUnitTable() throws DBException{
		logger.debug("Starting loadSiteUnitTable()");
		
		CodeTable siteUnitTable = new CodeTable("SHIFTER.SHF_ORG_UNITS_SHF_SITES","SHF_ORG_UNITS_SHF_SITES.SS_SITE_ID","SHF_ORG_UNITS_SHF_SITES.SOU_ORG_UNIT_ID");
		try{
			tablesContainer.setTable(TablesConstants.SITE_UNIT_TABLE,siteUnitTable.getRows());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadOrgUnit() throws DBException{
		logger.debug("Starting loadOrgUnit()");
		
		OrgUnitTableForm unitTableForm=new OrgUnitTableForm();
		unitTableForm.setCode("-1");
		unitTableForm.setDescription("הכל");
		unitTableForm.setType("-1");
		unitTableForm.setParent("-1");
		OrgUnitTableForm empty=new OrgUnitTableForm();
		empty.setCode("-1");
		empty.setDescription("");
		empty.setType("-1");
		empty.setParent("-1");
		tablesContainer.setTableEmptySelection(TablesConstants.UNIT_TABLE,empty);
		tablesContainer.setTableAll(TablesConstants.UNIT_TABLE,unitTableForm);
		ComplexCodeTable unitCode = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.UNIT_TABLE,unitCode.getUnitRows());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadJobs() throws DBException{
		logger.debug("Starting loadJobs()");
		
		TableForm tableForm=new TableForm();
		tableForm.setCode("00");
		tableForm.setDescription("הכל");
		tablesContainer.setTableAll(TablesConstants.JOB_TABLE,tableForm);
		ComplexCodeTable jobCode = new ComplexCodeTable();
		try{
			tablesContainer.setTable(TablesConstants.JOB_TABLE,jobCode.getJobRows());
		} catch (DBQueryNoRowsException e) {}
	}
	
	public void loadActivities() throws DBException{
		logger.debug("Starting loadActivities()");
		ActivityForm allActivities=new ActivityForm();
		allActivities.setCode("00");
		allActivities.setDescription("הכל");
		tablesContainer.setTableAll(TablesConstants.ACTIVITY_TABLE,allActivities);
		ComplexCodeTable activityCode = new ComplexCodeTable();
		
		try {
			tablesContainer.setTable(TablesConstants.ACTIVITY_TABLE,activityCode.getActivitiesRows());	
		} catch (DBQueryNoRowsException e) {}
	}

	public void loadEventReasons() throws DBException {
		logger.debug("Starting loadEventReasons()");
		TableInfo tableInfo=new EventReasonForm();
		tableInfo.setCode("00");
		tableInfo.setDescription("");
		tablesContainer.setTableEmptySelection(TablesConstants.EVENT_REASON_TABLE, tableInfo);
		ComplexCodeTable eventReasonCode = new ComplexCodeTable();
		try {
			tablesContainer.setTable(TablesConstants.EVENT_REASON_TABLE,eventReasonCode.getEventReasonRows());	
		} catch (DBQueryNoRowsException e) {}
	}

	public void loadSkills() throws DBException {
		logger.debug("Starting loadSkills()");
		
		CodeTable skillsCode = new CodeTable("SHIFTER.SHF_SKILLS","SHF_SKILLS.SKILL_ID","NVL(SHF_SKILLS.SKILL_DESC,SHF_SKILLS.SKILL_NAME)");
		try {
			tablesContainer.setTable(TablesConstants.SKILL_TABLE,skillsCode.getRows());
		} catch (DBQueryNoRowsException e) {}
	}
	
	
	public void loadVirtualActivities() throws DBException {
		logger.debug("Starting loadVirtualActivities()");
		
		CodeTable virtualActivityCode = new CodeTable("SHIFTER.SHF_VIRTUAL_ACTIVITIES","SHF_VIRTUAL_ACTIVITIES.VIRTUAL_ACTIVITY_ID","SHF_VIRTUAL_ACTIVITIES.NAME");
		try {
			tablesContainer.setTable(TablesConstants.VIRTUAL_ACTIVITY,virtualActivityCode.getRows());
		} catch (DBQueryNoRowsException e) {}
	}
	
	
	public void callUrl(String host){
		BufferedReader rd  = null;
		StringBuffer sb = null;
		try{
			URL url=new URL(host+"/shf/loadTables.do");		
			HttpURLConnection conn = (HttpURLConnection)url.openConnection();
			conn.setRequestMethod("GET");          
			conn.setDoOutput(true);          
			conn.connect();
			String line;
			rd  = new BufferedReader(new InputStreamReader(conn.getInputStream()));
			sb = new StringBuffer();
			while ((line = rd.readLine()) != null){                  	
					  sb.append(line);
					  sb.append("\n");                    	              
			}
			conn.disconnect();
		}catch(Exception e){
			logger.error(e.getMessage());
		}finally{
			try {
				rd.close();
				
			} catch (IOException e) {
				logger.error(e.getMessage());
			}
		}
	}
	//tamar-table-category_job
	public void loadCategoryJobTable() throws DBException{
		logger.debug("Starting loadCategoryJobTable()");
		
		CodeTable categoryJobCode = new CodeTable("SHIFTER.SHF_CATEGORY_TYPE","SHF_CATEGORY_TYPE.CATEGORY_ID","SHF_CATEGORY_TYPE.CATEGORY_DESCRIPTION");
		try{
			TableForm tableForm=new TableForm();
			tableForm.setCode("00");
			tableForm.setDescription("ללא");
			tablesContainer.setTableEmptySelection(TablesConstants.CATEGORY_JOB,tableForm);
			tablesContainer.setTable(TablesConstants.CATEGORY_JOB,categoryJobCode.getRows());
		} catch (DBQueryNoRowsException e) {}
	}
	//tamar-table-category_job


}
