/*
 * Created on 10/02/2012
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

import org.apache.commons.validator.GenericValidator;

import bzq.db.DBException;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.model.ForecastModel;
import bzq.shf.model.LoadTables;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.SharingUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.BaseConvert;

/**
 * @author 02964437
 *
 */
public class BatchLoadTables extends BaseBatchProcess {

// GLOBAL ARGUMENT
	
	private int sumRecScaned =0;
	private int sumWithTeam = 0;
	private int sumWithoutTeam = 0;
	private int sumMaster = 0;
	private int sumNotMaster = 0;
	
	private FileOutputStream fs;
	private PrintWriter writer;


	private String dateSTR = null;

	private Date fromDate = null;
	private Date toDate = null;

	private ForecastModel forecastModel = null;

//  COSTANT
	private static HashMap orgUnitsHM = new HashMap();

	/**
	 * @param args
	 */
	public BatchLoadTables(String[] args) {
		super(args);
		// TODO Auto-generated constructor stub
	}

	public static void main(String[] args) {
		System.out.println( " BatchLoadTables - START :" + new Date());
		System.setProperty("APP_PATH1", "http://vm-wasinp2:9083/shf/");
		System.setProperty("APP_PATH2", "http://vm-wasinp3:9083/shf/");
		
		SharingUtils.reloadTables(TablesConstants.SYSTEM_PARAM);
		SharingUtils.reloadTables(TablesConstants.ACTIVITY_TABLE);
		SharingUtils.reloadTables(TablesConstants.CATEGORY_JOB);
		SharingUtils.reloadTables(TablesConstants.COMPLETION_TABLE);
		SharingUtils.reloadTables(TablesConstants.EVENT_REASON_TABLE);
		SharingUtils.reloadTables(TablesConstants.EXCEPTION_TABLE);
		SharingUtils.reloadTables(TablesConstants.INNER_JOB_TABLE);
		SharingUtils.reloadTables(TablesConstants.SITE_UNIT_TABLE);
		SharingUtils.reloadTables(TablesConstants.SKILL_TABLE);
		SharingUtils.reloadTables(TablesConstants.TIMEOFF_TABLE);
		SharingUtils.reloadTables(TablesConstants.UNIT_TABLE);
		SharingUtils.reloadTables(TablesConstants.VIRTUAL_ACTIVITY);
		
		BatchLoadTables batchLoadTables=new BatchLoadTables(args);
		batchLoadTables.perform();
		System.out.println(" BatchLoadTables - END " + new Date());
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#createProcessBeanObject()
	 */
	protected Object createProcessBeanObject() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#execute()
	 */
	public void execute() throws ShfException  {
		System.out.println(" start execute()");

		System.out.println("end execute() - LoadTables");
	}


	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	protected void finishProcess() throws ShfException {
		insertDocs(ctiDocBean);
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcess()
	 */
	protected void initProcess() throws Exception {
//		holdJobTableUpdate(); 
//		loadAllTables();
//		AppResources.getInstance().setTablesContainer(ShfBatchConstants.tc);
//		loadSystemParam();
//		initOutputFile();
	}

	/**
	 * 
	 */
	private void initOutputFile() throws ShfException {
		String str = processBean.getOutputFileDir() + "SH" + BaseConvert.dateToString(new Date(),"yyMMdd") + ".txt";
		try {
			fs = new FileOutputStream(str, false);
			writer = new PrintWriter(fs);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			tracerLogger.error("initOutputFile() " + e.getMessage());
			throw new ShfException("error create output file ", e);
		}
		
	}

	/**
	 * 
	 */
	private void loadAllTables() {
		System.out.println("start : loadOrgUnits()");
		
		LoadTables loadTables = new LoadTables(ShfBatchConstants.tc);
		
		try {
			loadTables.loadJobs();	
			tracerLogger.info("jobs loaded");
			loadTables.loadOrgUnit();	
			tracerLogger.info("loadOrgUnit loaded");
			loadTables.loadSiteUnitTable();
			tracerLogger.info("loadSiteUnitTable loaded");
			loadTables.loadActivities();
			tracerLogger.info("loadActivities loaded");
			loadTables.loadEventReasons();
			tracerLogger.info("loadEventReasons loaded");
			loadTables.loadSkills();
			tracerLogger.info("loadSkills loaded");
			loadTables.loadParameters();
			tracerLogger.info("loadParameters loaded");
			loadTables.loadExceptions();
			tracerLogger.info("loadExceptions loaded");
			loadTables.loadVirtualActivities();
			tracerLogger.info("loadVirtualActivities loaded");
			loadTables.loadCompletions();
			tracerLogger.info("completions loaded");
			loadTables.loadInnerJobs();
			tracerLogger.info("innerJobs loaded");
			loadTables.loadTimeoffTypes();
			tracerLogger.info("timeoffTypes loaded");
		} catch (DBException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		Vector c=ShfBatchConstants.tc.getTable(TablesConstants.UNIT_TABLE);
		OrgUnitTableForm unitTableForm =  null;
		
		for (int i =0; i<c.size(); i++) {
			unitTableForm = (OrgUnitTableForm)c.get(i);
			orgUnitsHM.put(unitTableForm.getCode(), unitTableForm.getParent()); 
		}
		
		System.out.println("end : loadOrgUnits()");
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcessArguments()
	 */
	protected void initProcessArguments() throws Exception {
		int timeToMinusFromDate = 0;
		if (commandLineArguments.length>2 && !GenericValidator.isBlankOrNull(commandLineArguments[2]) ) {
			//get date to process in format: dd/MM/yyyy
			dateSTR = commandLineArguments[2];
		}
		else {
			//get default date to process according to daysBefore parameter 
			dateSTR = BaseConvert.dateToString(new Date(),"ddMMyyyy");
			timeToMinusFromDate = 1440;
		}
		try {
			fromDate = BaseConvert.stringToDate(dateSTR + " 00:00:00", "ddMMyyyy HH:mm:ss");
			fromDate = SHFUtils.getTimeCalc(fromDate, - timeToMinusFromDate);
			toDate = BaseConvert.stringToDate(dateSTR + " 23:59:59", "ddMMyyyy HH:mm:ss");
			toDate = SHFUtils.getTimeCalc(toDate, - timeToMinusFromDate);
		} catch (Exception e) {
			throw new ShfException("date format error");
		}
	}

}
