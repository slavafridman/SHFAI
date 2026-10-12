/*
 * Created on 10/02/2012
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Vector;

import org.apache.commons.validator.GenericValidator;

import bzq.db.DBException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.ForecastSchedualBean;
import bzq.shf.bean.OrgUnitHierarchyBean;
import bzq.shf.forms.ActivityForm;
import bzq.shf.forms.ForecastForm;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.forms.TableForm;
import bzq.shf.model.ForecastModel;
import bzq.shf.model.LoadTables;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.BaseConvert;
import bzq.utils.TablesContainer;

/**
 * @author 02964437
 *
 */
public class ForcastDataProcess extends BaseBatchProcess {

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
	public ForcastDataProcess(String[] args) {
		super(args);
		// TODO Auto-generated constructor stub
	}

	public static void main(String[] args) {
		System.out.println( " Process Forcast BI - START :" + new Date());
		ForcastDataProcess forcastProcess=new ForcastDataProcess(args);
		forcastProcess.perform();
		System.out.println(" Process Forcast BI - END " + new Date());
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
		prepareTeamData();
		prepareTeamMokedData();
//		prepareVirtualActivityData();
//		prepareMokedData();
		
		System.out.println("end execute()");
	}

	private void prepareVirtualActivityData() throws ShfException{
		System.out.println("select data for virtual activity");
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();

		Vector vecVirtualActivity=tc.getTable("virtualActivityCode");
		Vector allVirtualActivity = new Vector();
			
		if(vecVirtualActivity!=null){
			for(int i=0;i<vecVirtualActivity.size();i++){
				TableForm virtualActForm=(TableForm)vecVirtualActivity.get(i);
				allVirtualActivity.add(virtualActForm.getCode());
				System.out.println("=========================================================");
				System.out.println("  select data for : " +virtualActForm.getCode() + " Date: "+ BaseConvert.dateToString(fromDate, "ddMMyyyy HH:mm:ss") +" - " + BaseConvert.dateToString(toDate, "ddMMyyyy HH:mm:ss"));
				
				
				ForecastForm forecastForm = new ForecastForm();
				//TODO - update the form to be ready for the select virtual
			//	forecastForm.setActivitiesForSelect(activitiesForSelect);
				
				forecastForm.setActivitiesForSelect(null);
				forecastForm.setActivity(null);
				String activityList[] = new String[1];
				activityList[0]="00";
				forecastForm.setActivityList(activityList);
				forecastForm.setAllday(true);
				forecastForm.setDate(fromDate);
				String exceptionList[] = new String[1];
				exceptionList[0]="00";
				forecastForm.setExceptionList(exceptionList);
				forecastForm.setExceptionsForSelect(null);
				forecastForm.setIndexForSearch(1);
				forecastForm.setMoked("-1");
				forecastForm.setMultipartRequestHandler(null);
				forecastForm.setRbChoice("activity");
				forecastForm.setRbWithoutSign(false);
				forecastForm.setSumCallLength(0);
				forecastForm.setSumCallLengthTime(null);
				forecastForm.setSumCallsNum(0);
				forecastForm.setSumCallVal(0);
				forecastForm.setSumForecastCallLength(0);
				forecastForm.setSumForecastCallLengthTime(null);
				forecastForm.setSumForecastCallsNum(0);
				forecastForm.setSumGapTime(null);
				forecastForm.setSumMokedCallLengthList(null);
				forecastForm.setTimeFrom("00:00");
				forecastForm.setTimeTo("24:00");
				String virtualActivity[]=new String[1];
				virtualActivity[0] = virtualActForm.getCode();
				forecastForm.setVirtualActivity(virtualActivity);
				forecastForm.setWithBreak(true);
				forecastForm.setWithCalc(true);
				forecastForm.setWithChange(true);
				forecastForm.setWithException(true);
				forecastForm.setWithNeto(true);
				forecastForm.setWithNetoBreak(true);
				forecastForm.setWithReq(true);
				forecastForm.setWithSum(true);
				forecastForm.setWithWfm(true);
				
				
				forecastModel = new ForecastModel(forecastForm);
				//set details for Moked select
				forecastModel.setActivityForSelect();
				forecastModel.setExceptionForSelect();
				
				forecastModel.setActivityFromVirtual();
				
				//getData(forecastForm);
				
			}
		}
	}

	private void prepareMokedData() throws ShfException {
		System.out.println("select data for moked activity");
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		
		 
		Vector allowedUnits = new Vector();	
		Vector units=tc.getTable("unitCode");
		for (Iterator iteratorUnit = units.iterator(); iteratorUnit.hasNext();) {
			OrgUnitTableForm orgUnit = (OrgUnitTableForm) iteratorUnit.next();
			if(orgUnit.getType()!=null && orgUnit.getParent()!=null && orgUnit.getType().equalsIgnoreCase("G01")){
				allowedUnits.add(orgUnit.getCode());
//				System.out.println("Moked : " + orgUnit.getCode() + orgUnit.getDescription());
				System.out.println("=========================================================");
				
				Vector allActivity = new Vector();
				Vector vecActivity=tc.getTable("activityCode");
				if(vecActivity!=null){
					for (Iterator iteratorActivity = vecActivity.iterator(); iteratorActivity.hasNext();) {
//						ActivityBean actBean = new ActivityBean();
						ActivityForm activityForm=(ActivityForm)iteratorActivity.next();
						if (orgUnit.getCode().equalsIgnoreCase(activityForm.getMoked())) {
							allActivity.add(activityForm);
							System.out.println("  select data for : " +orgUnit.getCode() + " + " + activityForm.getCode() +" Date: "+ BaseConvert.dateToString(fromDate, "ddMMyyyy HH:mm:ss") +" - " + BaseConvert.dateToString(toDate, "ddMMyyyy HH:mm:ss"));
					
							ForecastForm forecastForm = new ForecastForm();
							//TODO - update the form to be ready for the select moked		
							forecastModel = new ForecastModel(forecastForm);
							//set details for Moked select
							forecastModel.setActivityForSelect();
							forecastModel.setExceptionForSelect();
							
							//getData(forecastForm);
							
						}
					}
				}
			}
		}
	}
	
	private void prepareTeamData() throws ShfException {
		//get sum forcast data by team
		//prepare the criteria to select teams 
		System.out.println("select data for Team activity");
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		
		OrgUnitHierarchyBean orgBean = new OrgUnitHierarchyBean();
		
		
		 
		Vector allowedUnits = new Vector();	
		Vector units=tc.getTable("unitCode");
		for (Iterator iteratorUnit = units.iterator(); iteratorUnit.hasNext();) {
			//select teams only
			OrgUnitTableForm orgUnit = (OrgUnitTableForm) iteratorUnit.next();
			if(orgUnit.getType()!=null && orgUnit.getParent()!=null && orgUnit.getType().equalsIgnoreCase("J01")){
				allowedUnits.add(orgUnit.getCode());
				
				
				//prepare the org unit
				orgBean.setTeam(orgUnit.getCode());
				orgBean.setMoked(SHFTableUtils.getMokedCodeOf(orgUnit.getCode()));
				orgBean.setAgaf(SHFTableUtils.getAgafCodeOf(orgBean.getMoked()));
				orgBean.setDiv(SHFTableUtils.getDivCodeOf(orgBean.getMoked()));
				//for test only
//				if (SHFTableUtils.getMokedCodeOf(orgUnit.getCode()).equals("00101275")) {
//				if (orgUnit.getCode().equals("00101340")) {
//					int inte = 0;
				
//				System.out.println("Moked : " + orgUnit.getCode() + orgUnit.getDescription());
				System.out.println("=========================================================");
	
				System.out.println("  select data for : " +orgUnit.getCode() +" Date: "+ BaseConvert.dateToString(fromDate, "ddMMyyyy HH:mm:ss") +" - " + BaseConvert.dateToString(toDate, "ddMMyyyy HH:mm:ss"));
		
				ForecastForm forecastForm = new ForecastForm();
				//TODO - update the form to be ready for the select moked		
				forecastModel = new ForecastModel(forecastForm);

				//set details for Moked select
				forecastForm.setActivitiesForSelect(null);
				forecastForm.setActivity(null);
				String activityList[] = new String[1];
				activityList[0]="00";
				forecastForm.setActivityList(activityList);
				forecastForm.setAllday(true);
				forecastForm.setDate(fromDate);
				String exceptionList[] = new String[1];
				exceptionList[0]="00";
				forecastForm.setExceptionList(exceptionList);
				forecastForm.setExceptionsForSelect(null);
				forecastForm.setIndexForSearch(0);
				forecastForm.setMoked(SHFTableUtils.getMokedCodeOf(orgUnit.getCode()));
				forecastForm.setMultipartRequestHandler(null);
				forecastForm.setRbChoice("team");
				forecastForm.setRbWithoutSign(false);
				forecastForm.setSumCallLength(0);
				forecastForm.setSumCallLengthTime(null);
				forecastForm.setSumCallsNum(0);
				forecastForm.setSumCallVal(0);
				forecastForm.setSumForecastCallLength(0);
				forecastForm.setSumForecastCallLengthTime(null);
				forecastForm.setSumForecastCallsNum(0);
				forecastForm.setSumGapTime(null);
				forecastForm.setSumMokedCallLengthList(null);
				forecastForm.setTeam(orgUnit.getCode());
				forecastForm.setTimeFrom("00:00");
				forecastForm.setTimeTo("24:00");
				String virtualActivity[]=new String[1];
				virtualActivity[0] = "00";
				forecastForm.setVirtualActivity(virtualActivity);
				forecastForm.setWithBreak(true);
				forecastForm.setWithCalc(true);
				forecastForm.setWithChange(true);
				forecastForm.setWithException(true);
				forecastForm.setWithNeto(true);
				forecastForm.setWithNetoBreak(true);
				forecastForm.setWithReq(true);
				forecastForm.setWithSum(true);
				forecastForm.setWithWfm(true);
				
				forecastModel.setActivityForSelect();
				forecastModel.setExceptionForSelect();
				
				getData(forecastForm, orgBean);
//				}
			}
		}
	}
	
	private void prepareTeamMokedData() throws ShfException {
		//get sum forcast data by moked
		//prepare the criteria to select users that belongs straight to moked  
		System.out.println("select data for Team activity");
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		
		OrgUnitHierarchyBean orgBean = new OrgUnitHierarchyBean();
 
		Vector allowedUnits = new Vector();	
		Vector units=tc.getTable("unitCode");
		for (Iterator iteratorUnit = units.iterator(); iteratorUnit.hasNext();) {
			//select moked only
			OrgUnitTableForm orgUnit = (OrgUnitTableForm) iteratorUnit.next();
			if(orgUnit.getType()!=null && orgUnit.getParent()!=null && orgUnit.getType().equalsIgnoreCase("G01")){
				allowedUnits.add(orgUnit.getCode());
				
				orgBean.setTeam("'לא ידוע'"); // this needed for state that users does not belong to team, but straight to moked
				orgBean.setMoked(orgUnit.getCode());
				orgBean.setAgaf(SHFTableUtils.getAgafCodeOf(orgBean.getMoked()));
				orgBean.setDiv(SHFTableUtils.getDivCodeOf(orgBean.getMoked()));
				//for test only, if needed to select only one org unit
//				if (SHFTableUtils.getMokedCodeOf(orgUnit.getCode()).equals("00101275")) {
//				if (orgUnit.getCode().equals("00101340")) {
//					int inte = 0;
				
				ForecastForm forecastForm = new ForecastForm();
				forecastModel = new ForecastModel(forecastForm);

				//set details for Moked select
				forecastForm.setActivitiesForSelect(null);
				forecastForm.setActivity(null);
				String activityList[] = new String[1];
				activityList[0]="00";
				forecastForm.setActivityList(activityList);
				forecastForm.setAllday(true);
				forecastForm.setDate(fromDate);
				String exceptionList[] = new String[1];
				exceptionList[0]="00";
				forecastForm.setExceptionList(exceptionList);
				forecastForm.setExceptionsForSelect(null);
				forecastForm.setIndexForSearch(0);
				forecastForm.setMoked(SHFTableUtils.getMokedCodeOf(orgUnit.getCode()));
				forecastForm.setMultipartRequestHandler(null);
				forecastForm.setRbChoice("team");
				forecastForm.setRbWithoutSign(false);
				forecastForm.setSumCallLength(0);
				forecastForm.setSumCallLengthTime(null);
				forecastForm.setSumCallsNum(0);
				forecastForm.setSumCallVal(0);
				forecastForm.setSumForecastCallLength(0);
				forecastForm.setSumForecastCallLengthTime(null);
				forecastForm.setSumForecastCallsNum(0);
				forecastForm.setSumGapTime(null);
				forecastForm.setSumMokedCallLengthList(null);
				//insert the moked code in to team to find users that connect to moked without team level
				forecastForm.setTeam(orgBean.getMoked());
				forecastForm.setTimeFrom("00:00");
				forecastForm.setTimeTo("24:00");
				String virtualActivity[]=new String[1];
				virtualActivity[0] = "00";
				forecastForm.setVirtualActivity(virtualActivity);
				forecastForm.setWithBreak(true);
				forecastForm.setWithCalc(true);
				forecastForm.setWithChange(true);
				forecastForm.setWithException(true);
				forecastForm.setWithNeto(true);
				forecastForm.setWithNetoBreak(true);
				forecastForm.setWithReq(true);
				forecastForm.setWithSum(true);
				forecastForm.setWithWfm(true);

				forecastModel.setActivityForSelect();
				forecastModel.setExceptionForSelect();
				
				getData(forecastForm, orgBean);
//				}	
			}
		}
	}
	
	private void getData(ForecastForm forecastForm, OrgUnitHierarchyBean orgBean) throws ShfException {
		// retrieve data from existing module
		Vector data = null;
		Vector masterData = null;
		Vector rowMasterVec = new Vector();
		ForecastSchedualBean rowMaster=new ForecastSchedualBean();
		ForecastSchedualBean row=new ForecastSchedualBean();
		
		if ( (forecastForm.getActivitiesForSelect().length() > 0 && forecastForm.getActivitiesForSelect()!=null) 
				||
				 (forecastForm.getExceptionsForSelect().length() > 0 && forecastForm.getExceptionsForSelect()!=null)	) 
			{
				data=forecastModel.populateSchedualForecast();
				masterData = forecastModel.sumSchData(data);
				
				for (int i=0;i<masterData.size();i++) {
					if (i%5==0) {
						//hour details
						rowMasterVec.add( rowMaster =(ForecastSchedualBean)masterData.get(i));
						System.out.println("time : " +	BaseConvert.dateToString(rowMaster.getTime(),"HH:mm") 
									+ "  neto wfm: " + (rowMaster.getShebotsMoked()-rowMaster.getExceptionsWFM()-rowMaster.getBreakExcepWFM() )   
									+ "  neto shf: " + ( rowMaster.getAfterChanges()-rowMaster.getExceptionsSHF()-rowMaster.getBreakExcepSHF() ) 
									+ "  break wfm " + rowMaster.getBreakExcepWFM()
									+ "  break shf " + rowMaster.getBreakExcepSHF());
						//insert master row - average for one hour 
						insertData(forecastForm, rowMaster, "1", orgBean);
						sumMaster++;
						
					} else {
						//quarter of hour details
						row =(ForecastSchedualBean)masterData.get(i);
						//insert detail row - details for every quarter hour
						insertData(forecastForm, row, "0", orgBean);
						sumNotMaster++;
					}
					if (orgBean.getTeam().equals("'לא ידוע'")) {
						sumWithoutTeam++;
					}
					else {
						sumWithTeam++;
					}
				}
			}
	}

	private void insertData(ForecastForm forecastForm, ForecastSchedualBean rowMaster, String master, OrgUnitHierarchyBean orgBean) throws ShfException {
		//initialize data and insert to table
		int param_index=1;
		StringBuffer sql=new StringBuffer();
		
		String param1=null, param2=null, param3=null, param4=null; 
		Date param5=null, param6=null; 
		long param7=0, param8=0, param9 = 0;
		Double param10=0.0, param11=0.0, param12=0.0, param13=0.0, param14=0.0, param15=0.0, param16=0.0, param17=0.0;
		long param18=0, param19=0;
		Double param20=0.0, param21=0.0, param22=0.0;
		long  param23=0, param24=0, param25=0, param26=0;
		Double param27=0.0,param28=0.0, param29=0.0;
		
		param1 = "'"+orgBean.getDiv()+"'";
		param2 = "'"+orgBean.getAgaf()+"'";
		param3 = "'"+orgBean.getMoked()+"'";
		param4 = orgBean.getTeam();
		param5 = fromDate;
		param6 = rowMaster.getTime();
		param7 = rowMaster.getTekhnonMaty();
		param8 = rowMaster.getRequiredStaffing();
		param9 = rowMaster.getTekhnonMaty() - rowMaster.getRequiredStaffing();
		param10 = (new Integer(rowMaster.getShebotsMoked()).doubleValue()) - rowMaster.getExceptionsWFM() -rowMaster.getBreakExcepWFM();
//		param11 = (new Integer(rowMaster.getAfterChanges()).doubleValue())-rowMaster.getExceptionsSHF()-rowMaster.getBreakExcepSHF();
		param11 = rowMaster.getAfterChanges()-rowMaster.getExceptionsSHF()-rowMaster.getBreakExcepSHF();
		param12 = rowMaster.getBreakExcepWFM();
		param13 = rowMaster.getBreakExcepSHF();
		param14 = (new Integer(rowMaster.getShebotsMoked()).doubleValue())-rowMaster.getExceptionsWFM();
//		param15 = (new Integer(rowMaster.getAfterChanges()).doubleValue())-rowMaster.getExceptionsSHF();
		param15 = rowMaster.getAfterChanges()-rowMaster.getExceptionsSHF();
		param16 = rowMaster.getExceptionsWFM();
		param17 = rowMaster.getExceptionsSHF();
		param18 = rowMaster.getShebotsMoked();
//		param19 = rowMaster.getAfterChanges();
		param19 = (long) rowMaster.getAfterChanges();
		param20 = rowMaster.getMissing();
		param21 = rowMaster.getLate();
		param22 = rowMaster.getCancelled();
//		param23 = rowMaster.getInExtraHours();
		param23 = (long) rowMaster.getInExtraHours();
//		param24 = rowMaster.getMarked();
		param24 = (long) rowMaster.getMarked();
//		param25 = rowMaster.getArrivals();
		param25 = (long) rowMaster.getArrivals();
//		param26 = rowMaster.getFutureExit();
		param26 = (long) rowMaster.getFutureExit();
		param27 = rowMaster.getShifting();
		param28 = rowMaster.getExtension();
		param29 = rowMaster.getShortening();
		
		sql.append(" INSERT INTO SHF_DAY_DATA_FOR_BI  ");
		sql.append(" 	  	(   DIVISION,  AGAF,  MOKED,  TEAM,  DATE_CALC,  "); //5
		sql.append("			TIME_CALC,  CALCULATED,  REQUIRED,  CALC_REQ_GAP,  NETO_WFM, "); //10
		sql.append(" 	  		NETO_SHF,  BREAK_WFM,  BREAK_SHF,   SHIFTS_WITH_BREAK_WFM,  SHIFTS_WITH_BREAK_SHF, "); //15  
		sql.append(" 	 		EXCEPTIONS_WFM,  EXCEPTION_SHF,  SUM_WFM,  SUM_SHF,  MISSING, "); //20
		sql.append(" 	 		LATE,  CANCELLED,  EXTRA_HOUR,  MARKED,  ARRIVALS, "); //25
		sql.append(" 	  		FUTURE_EXIT,  SHIFTING,  EXTENSION, SHORTING,  MASTER_ROW ) "); //30
		sql.append("      VALUES ( "+param1+", "+param2+", "+param3+", "+param4+", ?, "); //5
		sql.append("  			   ?, 			"+param7+", "+param8+", "+param9+", "+param10+",	"); //10
		sql.append("  			   "+param11+", "+param12+", "+param13+", "+param14+", "+param15+", 	"); //15
		sql.append("			   "+param16+", "+param17+", "+param18+", "+param19+", "+param20+", "); //20
		sql.append("			   "+param21+", "+param22+", "+param23+", "+param24+", "+param25+",  "); //25
		sql.append("			   "+param26+", "+param27+", "+param28+", "+param29+", "+master +" ) "); //30
		
		try{
			getDbAccess().prepareStatement(sql.toString());

			getDbAccess().setTimestamp(param_index++, param5); //5
			getDbAccess().setTimestamp(param_index++, param6); //6
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertData", e);
		}
	}

	private void freeJobTableUpdate() throws ShfException {
		int param_index=1;
		StringBuffer sql=new StringBuffer();

		sql.append(" DELETE FROM SHIFTER.SHF_CTI_JOB_TO_SAP ");
		sql.append("  WHERE JOB_ID = ? "); //1
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.HoldJobTableUpdate ); //1 
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("freeJobTableUpdate", e);
		}
	}

	private void holdJobTableUpdate() throws ShfException {
		int param_index=1;
		StringBuffer sql=new StringBuffer();

		sql.append(" INSERT INTO SHIFTER.SHF_CTI_JOB_TO_SAP ");
		sql.append("      VALUES ( ? ) "); //1
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.HoldJobTableUpdate ); //1 
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("holdJobTableUpdate", e);
		}
		
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	protected void finishProcess() throws ShfException {
		String str;
		char newLine = 13;
//		freeJobTableUpdate();
		sumRecScaned = sumWithTeam + sumWithoutTeam;
		ctiDocBean.setRecordsScanned( new Integer(sumRecScaned) );
		insertDocs(ctiDocBean);
		writer.close();
		try {
			fs.close();
		} catch (IOException e) {
			tracerLogger.error("initOutputFile() " + e.getMessage());
			throw new ShfException("error create output file ", e);
		}
		
		str = " -*-*-*-*-*-*-* SUMERY OF INSERT FORECAST BI *-*-*-*-*-*-*-*-" + newLine;
		tracerLogger.info(str);
		str = "sumRecScaned : " + sumRecScaned + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumWithTeam : " + sumWithTeam + newLine;
		tracerLogger.info(str);
		str = "sumWithoutTeam : " + sumWithoutTeam + newLine;
		tracerLogger.info(str);
		
		str = "-=-=-= MASTER - DETAILS =-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumMaster : " + sumMaster + newLine;
		tracerLogger.info(str);
		str = "sumNotMaster : " + sumNotMaster + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=" + newLine;
		tracerLogger.info(str);
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcess()
	 */
	protected void initProcess() throws Exception {
//		holdJobTableUpdate(); 
		loadOrgUnits();
		AppResources.getInstance().setTablesContainer(ShfBatchConstants.tc);
		loadSystemParam();
		initOutputFile();
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
	private void loadOrgUnits() {
		System.out.println("start : loadOrgUnits()");
		
		LoadTables loadTables = new LoadTables(ShfBatchConstants.tc);
		try {
			loadTables.loadOrgUnit();
			loadTables.loadActivities();
			loadTables.loadVirtualActivities();
			loadTables.loadSiteUnitTable();
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
