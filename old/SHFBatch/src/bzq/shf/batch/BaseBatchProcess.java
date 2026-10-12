package bzq.shf.batch;
import java.io.File;
import java.util.Date;

import org.apache.commons.validator.GenericValidator;
import org.apache.log4j.Category;
import org.apache.log4j.FileAppender;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.log4j.PatternLayout;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.shf.batch.beans.BatchCtiDocBean;
import bzq.shf.batch.beans.BatchDocBean;
import bzq.shf.batch.beans.ProcessBean;
import bzq.shf.batch.utils.FileStack;
import bzq.shf.model.LoadTables;
import bzq.shf.utils.ShfException;
import bzq.utils.AppInfo;
import bzq.utils.AppStartup;
import bzq.validator.Validator;
	//import oracle.jdbc.driver.*;
//import oracle.*;
/**
 * Insert the type's description here.
 * Creation date: (05/12/2002 17:16:56)
 * @author: Natana Cohen
 */
public abstract class BaseBatchProcess {
	private String processName = null;
	private String batchConfigFileName = null;
	//command line arguments
	protected String[] commandLineArguments = null;
	// loggers
	protected Logger errorLogger = null;
	protected Logger tracerLogger = null;
	// batch proccess bean
	protected ProcessBean processBean = null;
	// proccess table ref
	protected BatchDocBean batchDocBean = null;
	protected BatchCtiDocBean ctiDocBean = null;
	protected Process process = null;
	// database access	
	private DBAccess dbAccess = null;
	private DBAccess docsDBAccess = null;
	//stack file name(if has)
	private FileStack fileStack = null;
	
	//    private String inputFile;
	protected Validator validator = null;
	protected AppInfo appInfo = null;
	protected String environment = null;
	/**
	 * Insert the method's description here.
	 * Creation date: (21/09/2003 16:13:43)
	 * @param args java.lang.String[]
	 */
	public BaseBatchProcess(String[] args) {
		this.commandLineArguments = args;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (14/09/2003 14:56:53)
	 * @return mdr.batch.model.BaseBatchProcess
	 */
	protected abstract Object createProcessBeanObject();
	/**
	 * Insert the method's description here.
	 * Creation date: (05/12/2002 17:34:38)
	 * @param args java.lang.String[]
	 */
	public abstract void execute() throws Exception;
	/**
	 * Insert the method's description here.
	 * Creation date: (05/12/2002 17:33:11)
	 */
	protected void finish() {
		
		try{
			finishProcess();
			printStatistic();
			getDbAccess().commit();
			docsDBAccess.commit();
			dbAccess.close();
			docsDBAccess.close();
		}catch(Exception e){
			e.printStackTrace();
			try {
				getDbAccess().rollback();
				docsDBAccess.rollback();
				ctiDocBean.setProcessStatus(ShfBatchConstants.STATUS_ERROR);
			} catch (DBException e1) {
				e.printStackTrace();
			}
		}
			
//		try {
//			getDbAccess().commit();
//			docsDBAccess.commit();
//			dbAccess.close();
//			docsDBAccess.close();
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
		
		
		if (ctiDocBean.getProcessStatus() != null
			&& ctiDocBean.getProcessStatus().equalsIgnoreCase(ShfBatchConstants.STATUS_ERROR)) {
			System.out.println("The process ended with errors, check the log file for details");
			System.exit(-1);
		}
		
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (05/12/2002 17:33:11)
	 */
	protected abstract void finishProcess() throws ShfException ;
	/**
	 * Insert the method's description here.
	 * Creation date: (21/09/2003 16:10:22)
	 * @return bzq.db.DBAccess
	 */
	public bzq.db.DBAccess getDbAccess() {
		return dbAccess;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (17/12/2003 15:30:56)
	 * @return mdr.batch.utils.FileStack
	 */
	public FileStack getFileStack() {
		return fileStack;
	}
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected void init() throws Exception {
		//create the Bean we need for this batch process
		Object processBeanObject = createProcessBeanObject();
		// init command line arguments
		initArguments();
		// read batch xml configuration file	
		initBatchConfig();
		
		initBatchDocBean();
		// init the loggers
		initLoggers();
		// init App Startup
		initApp();
		// create dbAccess
		dbAccess = new DBAccess(false);
		docsDBAccess = new DBAccess(false);
		// init
		initProcess();
		
	}
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected void initApp() throws Exception {
		AppStartup appStartup =
			new AppStartup(new File("shfbatch-config.xml"), 2, false);
		appStartup.startup();
		appInfo = appStartup.getAppInfo();
		environment = appInfo.getEnvironment();
		appStartup.initTablesContainer();
	}
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected void initArguments() throws Exception {
		if (commandLineArguments.length < 2)
			throw new Exception("missing command line arguments (xml file name && process name)");
		batchConfigFileName = commandLineArguments[0];
		processName = commandLineArguments[1];
		initProcessArguments();
	}
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected void initBatchConfig() throws Exception {
		File configFile = new File(batchConfigFileName);
		BatchProcessInitializer batchProcessInitializer =
			new BatchProcessInitializer(configFile, processName);
		batchProcessInitializer.parse();
		processBean = batchProcessInitializer.getProcessBean();
		if (processBean == null)
			throw new Exception(
				"no process bean was returned ! (processName="
					+ processName
					+ ")");
	}
	
	protected void initBatchDocBean() throws Exception {
		ctiDocBean = new BatchCtiDocBean();
		ctiDocBean.setProcessKey( new Integer(Integer.parseInt(processBean.getProcessKey())));
		ctiDocBean.setProcessStatus(ShfBatchConstants.STATUS_IN_PROCESS);	

	}
		
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected void initLoggers() throws Exception {
		//init loggers
		//Example of Pattern Layout
		//%d{ddMMyyyy HHmmss} %-5p %-30.30C{1}- %m\r\n
		PatternLayout tracerLayout =
			new PatternLayout("%d{dd-MM-yyyy HH:mm:ss.SSS} - %m\n");
		PatternLayout layout = new PatternLayout("%m\r\n");
		FileAppender errorAppender = null;
		String errFileName = null;

		if (GenericValidator.isBlankOrNull(ctiDocBean.getFileName())) {
			ctiDocBean.setFileName(processName);
		}
		//If error file name not in intprocess.xml
		if (GenericValidator.isBlankOrNull(processBean.getErrorFileName())) {
			//Setting error file name same to process file name 
			errFileName =
				processBean.getErrorFileDir()
					+ ctiDocBean.getFileName()
					+ "_SHG";
		} else {
			//Setting error file name same to intprocess.xml propertie 
			errFileName =
				processBean.getErrorFileDir()
					+ processBean.getErrorFileName()
					+ "_SHG";

		}
		try {
			errorAppender = new FileAppender(layout, errFileName);
		} catch (Exception e) {
		}
		errorLogger = Logger.getLogger(processBean.getErrorFileName());
		errorLogger.addAppender(errorAppender);
		errorLogger.setLevel((Level) org.apache.log4j.Level.DEBUG);
		//-------------------------------------------------------------
		//Tracer
		FileAppender tracerAppender = null;
		String tracerFileName =
			processBean.getLogFileDir()
				+ ctiDocBean.getFileName()
				+ "_tracer.log";
		try {
			tracerAppender =
				new FileAppender(tracerLayout, tracerFileName, true);
		} catch (Exception e) {
		}
		//yuval
		tracerLogger = Logger.getLogger(processBean.getErrorFileName());
		tracerLogger.addAppender(tracerAppender);
		tracerLogger.setLevel((Level) org.apache.log4j.Level.DEBUG);
		
		Category bzqCategory = Category.getInstance("bzq");
		bzqCategory.addAppender(tracerAppender);
		bzqCategory.setAdditivity(true);
		//set severity of bzq by definition from xml
		if (processBean.getLogSeverityBzq().toUpperCase().equals("INFO")
			== true) {
			bzqCategory.setLevel((Level) org.apache.log4j.Level.INFO);
		} else if (
			processBean.getLogSeverityBzq().toUpperCase().equals("DEBUG")
				== true) {
			bzqCategory.setLevel((Level) org.apache.log4j.Level.DEBUG);

		} else if (
			processBean.getLogSeverityBzq().toUpperCase().equals("ERROR")
				== true) {
			bzqCategory.setLevel((Level) org.apache.log4j.Level.ERROR);
		} else {
			bzqCategory.setLevel((Level) org.apache.log4j.Level.WARN);
		}

	}
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected abstract void initProcess() throws Exception;
	/**
	 * InterfaceTransactionProcess constructor comment.
	 */
	protected abstract void initProcessArguments() throws Exception;
	/**
	 * Insert the method's description here.
	 * Creation date: (17/09/2003 13:21:12)
	 */
	public void perform() {
		try {
			init();
			execute();
			ctiDocBean.setProcessStatus(ShfBatchConstants.STATUS_COMPLETE);
		} catch (Exception e) {
			e.printStackTrace();
			errorLogger.error(e.getMessage());
			tracerLogger.error(e.getMessage());
			try {
				getDbAccess().rollback();
				ctiDocBean.setProcessStatus(ShfBatchConstants.STATUS_ERROR);
				System.out.println("process Ended with Errors - RollBack!!!!!");
				tracerLogger.error("process Ended with Errors - RollBack!!!!!");
				//process.setProcessStatus(ShfBatchConstants.STATUS_ERROR,docsDBAccess);	
					
			} catch (Exception ex) {
				tracerLogger.error(ex.getMessage());
				ex.printStackTrace();
			}
		} finally {
			finish();
		}
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/09/2003 13:30:08)
	 */
	private void printStatistic() {
		char newLine = 13;
		StringBuffer str = new StringBuffer();
		str.append(" Added records -");
		str.append(ctiDocBean.getRecordsAdded().intValue());
		str.append("\n");
		str.append(" Modified records - ");
		str.append(ctiDocBean.getRecordsModified().intValue());
		str.append("\n");
		str.append(" Deleted records - ");
		str.append(ctiDocBean.getRecordsDeleted().intValue());
		str.append("\n");
		str.append(" Invalid records - ");
		str.append(ctiDocBean.getRecordsInvalid().intValue());
		str.append("\n");
		tracerLogger.error(str.toString() + newLine);

		str = new StringBuffer();
		str.append(" Total records - ");
		str.append(
			ctiDocBean.getRecordsModified().intValue()
				+ ctiDocBean.getRecordsInvalid().intValue()
				+ ctiDocBean.getRecordsAdded().intValue());
		str.append("\n");
		str.append(" Total records scanned - ");
		str.append(ctiDocBean.getRecordsScanned().intValue());
//		str.append("Records in header - " + recordsNum);
		str.append("\n");
//		if (recordsNum > 0
//			&& ctiDocBean.getRecordsScanned() != null
//			&& recordsNum != ctiDocBean.getRecordsScanned().intValue()) {
//			str.append("The total records scanned quantity is different of records in file header quantity!!! \n");
//		}
		tracerLogger.error(str.toString() + newLine);
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (17/12/2003 15:30:56)
	 * @param newFileStack mdr.batch.utils.FileStack
	 */
	void setFileStack(FileStack newFileStack) {
		fileStack = newFileStack;
	}
	protected long recordsNum = 0;
	
	public long geNextDocKeyValue() { 
		System.out.println("geNextKeyValue()");
		
		long lastKey; 
		lastKey = 0;
		StringBuffer sql=new StringBuffer();
		sql.append("select shifter.shf_process_doc_key.nextval from dual ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().executeQuery();
			getDbAccess().next();
			lastKey = getDbAccess().getLong(1);
		}catch(DBException e){
			e.printStackTrace();
			//throw new ShfException("geNextKeyValue", e);
		}
		
		return lastKey;
	}
	
	public Date getLastRunDate() throws ShfException{
		System.out.println("getLastRunDate()");
		int param_index=1;
		 
		Date lastDate = null;
		StringBuffer sql=new StringBuffer();
		sql.append(" SELECT MAX(END_PROCESS_DATE) ");
		sql.append("   FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append("  WHERE PROCESS_STATUS=? ");
		sql.append("    AND PROCESS_KEY = 1 ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setString(param_index++, ShfBatchConstants.STATUS_COMPLETE);
			getDbAccess().executeQuery();
			getDbAccess().next();
			lastDate = getDbAccess().getTimestamp(1);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getLastRunDate()", e);
		}
		
		return lastDate;
	}
	
	public void loadSystemParam() throws ShfException {
		System.out.println("start : loadSystemParam()");
		
		LoadTables loadTables = new LoadTables(ShfBatchConstants.tc);
		try {
			loadTables.loadParameters();
		} catch (DBException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			throw new ShfException("loadSystemParam()", e);
		}
		
		System.out.println("end : loadSystemParam()");
	}
	protected void insertDocs(BatchCtiDocBean docBean) throws ShfException {
		System.out.println("insertDocs()");
		int param_index=1;
		long nexValKey = 0;
		StringBuffer sql=new StringBuffer();

		nexValKey = geNextDocKeyValue();

		sql.append(" INSERT INTO SHIFTER.SHF_BATCH_DOCS (PROCESS_DOC_KEY, PROCESS_KEY, EXEC_DATE, DOC_DESC, "); 
		sql.append("             LAST_COMMIT_REC, OPERATION_PRM, PROCESS_STATUS, REC_ADDED, REC_INVALID, REC_MODIFIED, REC_SCANED, ");
		sql.append("             SOURCE_KEY, STEP_IN_PROGRESS, TRIGGER_DATE, START_PROCESS_DATE, END_PROCESS_DATE, SAP_REQ_ID, ");
		sql.append("			 P1_PART_NO_END, P1_PART_NO_START, P2_4_OK_SHIFT, P2_4_SHIFT_NO_START, P2_4_SHIFT_NO_END, P2_4_LONG_SHIFT, ");
		sql.append(" 			 P3_CTI_WITH_SHF, P3_TIDRUCH, P3_TIDRUCH_NO_USER, P3_TIDRUCH_NO_ORG, P3_SUM_SYSTEM, P3_SYSTEM_NO_USER, P3_SYSTEM_NO_ORG, P4_SUM_USERS ) ");
		sql.append("      VALUES (?, ?, ?, null,  ");
		sql.append("              null, null, ?, ?, 0, 0, ?, ");
		sql.append("              0, null, null, ?, ?, ?, "); 
		sql.append("              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, nexValKey); // PROCESS_DOC_KEY
			getDbAccess().setInteger(param_index++, docBean.getProcessKey()); // PROCESS_KEY
			getDbAccess().setTimestamp(param_index++,new Date());// EXEC_DATE
			getDbAccess().setString(param_index++, docBean.getProcessStatus()); // PROCESS_STATUS
			getDbAccess().setInteger(param_index++, docBean.getRecordsAdded()); //REC_ADDED
			getDbAccess().setInteger(param_index++,docBean.getRecordsScanned()); // REC_SCANED
			getDbAccess().setTimestamp(param_index++, docBean.getStartProcessDate()); // START_PROCESS_DATE
			getDbAccess().setTimestamp(param_index++, docBean.getEndProcessDate()); // END_PROCESS_DATE
			getDbAccess().setLong(param_index++, docBean.getSapReqId()); // SAP_REQ_ID
			getDbAccess().setLong(param_index++, docBean.getP1PartNoEnd()); //P1_PART_NO_END
			getDbAccess().setLong(param_index++, docBean.getP1PartNoStart()); //P1_PART_NO_START
			getDbAccess().setLong(param_index++, docBean.getP2_4_OkShift()); //P2_4_OK_SHIFT
			getDbAccess().setLong(param_index++, docBean.getP2_4_ShiftNoStart()); //P2_4_SHIFT_NO_START
			getDbAccess().setLong(param_index++, docBean.getP2_4_ShiftNoEnd()); //P2_4_SHIFT_NO_END
			getDbAccess().setLong(param_index++, docBean.getP2_4_LongShift()); //P2_4_LONG_SHIFT
			getDbAccess().setLong(param_index++, docBean.getP3_CtiWithShf()); //P3_CTI_WITH_SHF
			getDbAccess().setLong(param_index++, docBean.getP3Tidruch()); //P3_TIDRUCH
			getDbAccess().setLong(param_index++, docBean.getP3TidruchNoUser()); //P3_TIDRUCH_NO_USER
			getDbAccess().setLong(param_index++, docBean.getP3TidruchNoOrg()); //P3_TIDRUCH_NO_ORG
			getDbAccess().setLong(param_index++, docBean.getP3SumSystem()); //P3_SUM_SYSTEM
			getDbAccess().setLong(param_index++, docBean.getP3SystemNoUser()); //P3_SYSTEM_NO_USER
			getDbAccess().setLong(param_index++, docBean.getP3SystemNoOrg()); //P3_SYSTEM_NO_ORG
			getDbAccess().setLong(param_index++, docBean.getP4SumUsers()); //P4_SUM_USERS
			
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertDocs() : ", e);
		}
		
	}
}
