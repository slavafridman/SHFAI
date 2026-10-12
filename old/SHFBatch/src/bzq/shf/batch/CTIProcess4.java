/*
 * Created on 15/12/2009
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
import java.util.Map;
import java.util.Vector;

import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.batch.beans.CtiCompletionBean;
import bzq.shf.batch.beans.CtiShiftBean;
import bzq.shf.batch.beans.SapCompletionLineBean;
import bzq.shf.batch.beans.SapCtiShiftLineBean;
import bzq.shf.batch.utils.FileUtil;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.model.LoadTables;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.BaseConvert;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CTIProcess4 extends BaseBatchProcess {

// GLOBAL ARGUMENT
    private long sapReqId = 0;
	private int sumCtiShiftFoundForSap = 0;
	private int sumCompletionFoundForSap = 0;
	private int sumShiftForSap = 0;
	private int sumCompletionForSap = 0;
	private int sumShiftLineForSapFile = 0;
	private int sumCompletionLineForSapFile = 0;
	private int sumNotOkCompletion = 0;
	private int sumNotOkShift = 0;
	
	private int sumRecScaned =0;
	private int sumShiftForSapNoStart = 0;
	private int sumShiftForSapNoEnd = 0;
	private int sumShiftForSapTooLong = 0;
	private int sumUsersToSap = 0;
	//private static int processKey = 4;
	
	private FileOutputStream fs;
	private PrintWriter writer;
	private String OutputFileName = null;
	
	private FileOutputStream fsError;
	private PrintWriter errorWriter;
	private String ErrorFileName = null;

	

//  COSTANT
	private static HashMap orgUnitsHM = new HashMap();

	/**
	 * @param args
	 */
	public CTIProcess4(String[] args) {
		super(args);
		// TODO Auto-generated constructor stub
	}

	public static void main(String[] args) {
		System.out.println( " Process SAP - START :" + new Date());
		CTIProcess4 ctiProcess=new CTIProcess4(args);
		ctiProcess.perform();
		System.out.println(" Process SAP - END " + new Date());
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
		System.out.println("execute()");
		sapReqId = getSapReqId();

		updateEmployeeSapStatus();
		sapCtiShiftFile();
		sapCompletionFile();
		updateToNeverDeliverStatus();
		
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

	private void updateToNeverDeliverStatus() throws ShfException {
		updateShiftToNeverDeliver();
		updateShiftEmployeeNotActiveToNeverDeliver();
		updateCompletionToNeverDeliver();
		updateCompletionEmployeeNotActiveToNeverDeliver();
	}

	private void updateShiftToNeverDeliver() throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS ");
		sql.append("    SET SAP_STATUS = ? "); //1
		sql.append(" WHERE CTI_SHIFT_ID IN ( SELECT CTI_SHIFT_ID ");
		sql.append("                       	   FROM SHIFTER.SHF_CTI_SHIFTS , SHIFTER.SHF_EMPLOYEES E   "); 
		sql.append("                          WHERE  CREDIT_STATUS = ? "); //2
		sql.append(" 							AND  EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); 
		sql.append(" 							AND  SAP_STATUS = ?  "); //3
		sql.append(" 							AND  (E.OPTIONAL1 is Null OR E.OPTIONAL1 <> ?) "); //4
		sql.append(" 							AND (HANDLE_STATUS = ? OR HANDLE_STATUS = ? OR HANDLE_STATUS = ? OR HANDLE_STATUS = ? )"); // 5, 6, 7, 8
		sql.append(" 		                )");
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiNeverDeliver); // 1 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditCalcedSTATUS); // 2 CREDIT_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapNotDeliveredSTATUS); // 3 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapToDeliver); // 4 OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftOkSTATUS); // 5 HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftNoStartSTATUS); // 6 HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftNoEndSTATUS); // 7 HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftTooLongSTATUS); // 8 HANDLE_STATUS
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateShiftToNeverDeliver", e);
		}		
	}

	private void updateShiftEmployeeNotActiveToNeverDeliver() throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS ");
		sql.append("    SET SAP_STATUS = ? "); //1
		sql.append(" WHERE CTI_SHIFT_ID IN ( SELECT CTI_SHIFT_ID ");
		sql.append("                       	   FROM SHIFTER.SHF_CTI_SHIFTS , SHIFTER.SHF_EMPLOYEES E   "); 
		sql.append("                          WHERE  CREDIT_STATUS = ? "); //2
		sql.append(" 							AND  EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); 
		sql.append(" 							AND  E.status_id  = ?  "); //3
		sql.append(" 							AND  SAP_STATUS  <> ?  "); //4
		sql.append(" 		                )");
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiEmpNotActive_NoDeliver); // 1 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditCalcedSTATUS); // 2 CREDIT_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeNotActiveStatus); // 3 EMPLOYEE.STATUS_ID
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiNeverDeliver); // 4  cti_shifts SAP_STATUS
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateShiftNotActiveToNeverDeliver", e);
		}		
	}	
	
	private void updateCompletionToNeverDeliver() throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" UPDATE SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS ");
		sql.append("    SET SAP_STATUS = ? "); //1
		sql.append(" WHERE COPMLETION_SEQ_CODE IN ( SELECT C.COPMLETION_SEQ_CODE ");
		sql.append("                       	  		  FROM SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS C, SHIFTER.SHF_CTI_EMP_COMPLETION_PARTS P, SHIFTER.SHF_EMPLOYEES E "); 
		sql.append("                          		 WHERE C.SAP_STATUS = ? "); //2
		sql.append(" 								   AND C.EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); 
		sql.append(" 								   AND  ( E.OPTIONAL1 IS NULL OR E.OPTIONAL1 <> ? )  "); //3
		sql.append(" 								   AND C.COPMLETION_SEQ_CODE = P.COPMLETION_SEQ_CODE  "); 
		sql.append(" 								   AND C.SAP_REQ_ID IS NULL "); 
		sql.append(" 		                 	  )");
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiNeverDeliver); // 1 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.completionToSap); // 2 OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional1DeliverToSap); // 3 OPTIONAL1
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCompletionToNeverDeliver", e);
		}	
		
	}

	private void updateCompletionEmployeeNotActiveToNeverDeliver() throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" UPDATE SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS ");
		sql.append("    SET SAP_STATUS = ? "); //1
		sql.append(" WHERE COPMLETION_SEQ_CODE IN ( SELECT C.COPMLETION_SEQ_CODE ");
		sql.append("                       	  		  FROM SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS C, SHIFTER.SHF_CTI_EMP_COMPLETION_PARTS P, SHIFTER.SHF_EMPLOYEES E "); 
		sql.append("                          		 WHERE C.SAP_STATUS = ? "); //2
		sql.append(" 								   AND C.EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); 
		sql.append(" 								   AND E.status_id  = ?  "); //3
		sql.append(" 								   AND C.COPMLETION_SEQ_CODE = P.COPMLETION_SEQ_CODE  "); 
		sql.append(" 								   AND C.SAP_REQ_ID IS NULL "); 
		sql.append(" 								   AND C.SAP_STATUS <> ? "); //4
		sql.append(" 		                 	  )");
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiEmpNotActive_NoDeliver); // 1 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.completionToSap); // 2 SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeNotActiveStatus); // 3 EMPLOYEE.STATUS_ID
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiNeverDeliver); // 4 SHF_CTI_EMPLOYEE_COMPLETIONS SAP_STATUS
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCompletionEmployeeNotActiveToNeverDeliver", e);
		}	
		
	}
	
	private void updateEmployeeSapStatus() throws ShfException {
		addEmployeeToSap();
		removeEmployeeFromSap();
		
	}

	private void removeEmployeeFromSap() throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" UPDATE SHIFTER.SHF_EMPLOYEES ");
		sql.append("    SET OPTIONAL1 = ? "); //1
		sql.append("  WHERE (OPTIONAL2 = ? OR OPTIONAL2 IS NULL) "); // 2  
		sql.append("    AND OPTIONAL1 = ? "); // 3
		sql.append("    AND JOB_ID NOT IN (SELECT JOB_ID FROM  SHIFTER.SHF_CTI_JOB_TO_SAP) "); //3 
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional1NotDeliverToSap ); //1  OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional2AutoToSap ); //2  OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional1DeliverToSap ); //3 OPTIONAL2
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("removeEmployeeFromSap", e);
		}		
	}

	private void addEmployeeToSap() throws ShfException {
		int param_index=1;
		StringBuffer sql=new StringBuffer();
		
		sql.append(" UPDATE SHIFTER.SHF_EMPLOYEES ");
		sql.append("    SET OPTIONAL1 = ? "); //1
		sql.append("  WHERE (OPTIONAL2 = ? OR OPTIONAL2 IS NULL) "); // 2
		sql.append("    AND (OPTIONAL1 = ? OR OPTIONAL1 IS NULL) "); // 3 
		sql.append("    AND JOB_ID IN (SELECT JOB_ID FROM SHIFTER.SHF_CTI_JOB_TO_SAP) ");  
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional1DeliverToSap ); //1 OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional2AutoToSap ); //2 OPTIONAL2
			getDbAccess().setInt(param_index++, ShfBatchConstants.Optional1NotDeliverToSap ); //3 OPTIONAL1
			getDbAccess().executeUpdate();
		
		}catch(DBUpdateNoRowsException e){
			e.printStackTrace();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("addEmployeeToSap", e);
		}	
	}

	/**
	 * 
	 */
	private void sapCompletionFile() throws ShfException {
		calcCompletionParts();
		prapareCompletionFile();
	}

	/**
	 * 
	 */
	private void prapareCompletionFile() throws ShfException {
		Vector compForSap = getAllCompletionReadyForSap();
		if ( (compForSap.size() > 0) && (compForSap != null) ) {
			prapareCompletionSapFile(compForSap);
		} else {
			tracerLogger.info("**** NO COMPLETION DATA FOR PROCESS ****");
		}	
	}

	/**
	 * @param compForSap
	 */
	private void prapareCompletionSapFile(Vector compForSap) throws ShfException {
		CtiCompletionBean compBean=null;
		String sapLine;
		boolean forFile = false;
		for(int i =0; i <compForSap.size(); i++) {
			forFile = false;
			SapCompletionLineBean sapLinebean = null;
			compBean = (CtiCompletionBean)compForSap.get(i);
			sumCompletionFoundForSap++;
			
			if ( (compBean.getCopmletionStart() != null) && (compBean.getEmpId().length() == 8)) {
				sapLinebean = new SapCompletionLineBean(compBean, ShfBatchConstants.Sap_Line_IN);
				System.out.println(sapLinebean);
				writer.println(sapLinebean);
				forFile = true;
				sumCompletionLineForSapFile++;
			}
			if ( (compBean.getCopmletionEnd() != null) && (compBean.getEmpId().length() == 8)) {
				sapLinebean = new SapCompletionLineBean(compBean, ShfBatchConstants.Sap_Line_OUT);
				System.out.println(sapLinebean);
				writer.println(sapLinebean);
				forFile = true;
				sumCompletionLineForSapFile++;
			}
			if (forFile) {
				sumCompletionForSap++;
				updateCompletionForSap(compBean, ShfBatchConstants.CtiSapDeliveredSTATUS);
			} else {
				sumNotOkCompletion++;
				updateCompletionForSap(compBean, ShfBatchConstants.CtiSapNotOkSTATUS);
			}
		}
	}
	/**
	 * @param compBean
	 */
	private void updateCompletionForSap(CtiCompletionBean compBean, int status) throws ShfException {
		//System.out.println("updateCompletionForSap()");
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS  ");
		sql.append(" SET SAP_STATUS = ?, SAP_REQ_ID = ?  "); // 1, 2
		sql.append(" WHERE COPMLETION_SEQ_CODE = ? "); // 3
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, status); // 1
			getDbAccess().setLong(param_index++, sapReqId); // 2
			getDbAccess().setLong(param_index++,compBean.getCopmletionSeqCode()); // 3
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCompletionForSap", e);
		}	
	}

	/**
	 * @return
	 */
	private Vector getAllCompletionReadyForSap() throws ShfException {
		System.out.println("getAllCompletionReadyForSap()");
		Vector recs = new Vector();
		int param_index=1;
		StringBuffer sql=new StringBuffer();

		sql.append(" SELECT C.EMP_ID, C.COPMLETION_SEQ_CODE, P.COMPLETION_PART_START COPMLETION_START  , P.COMPLETION_PART_END  COPMLETION_END ");
		sql.append("   FROM SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS C, SHIFTER.SHF_CTI_EMP_COMPLETION_PARTS P, SHIFTER.SHF_CTI_COMPLETIONS CC, ");
		sql.append("        SHIFTER.SHF_EMPLOYEES E "); 
		sql.append("  WHERE SAP_STATUS = ? ");
		sql.append("    AND EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) ");
		sql.append("    AND  E.OPTIONAL1 = ? ");
		sql.append("    AND C.COPMLETION_SEQ_CODE = P.COPMLETION_SEQ_CODE ");
		sql.append("    AND CC.COMPLETION_CODE = C.COMPLETION_CODE ");
		sql.append("    AND CC.SAP_PAY = ? ");
		sql.append(" 	AND SAP_REQ_ID IS NULL ");
		sql.append("   AND  ( E.STATUS_ID = ? OR E.STATUS_ID = ?) ");
		sql.append(" ORDER BY COPMLETION_SEQ_CODE ");
		
		try{
			CtiCompletionBean completionBean=null;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.completionCalcedSTATUS); // SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapToDeliver); // OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.completionToSap); // SAP_PAY
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeActiveStatus); // EMPLOYEE STATUS_ID
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeTempNotActiveStatus); // EMPLOYEE STATUS_ID
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				completionBean=new CtiCompletionBean();
				getDbAccess().populate(completionBean);
				recs.add(completionBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getAllCompletionReadyForSap");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCompletionReadyForSap : ", e);
		}

		return recs;
	}

	/**
	 * 
	 */
	private void calcCompletionParts() throws ShfException {
		Vector allCompVec = getAllCompletionForSap();
		Vector calcCompVec = null;
		Vector calcPart = null;
		CtiCompletionBean comPartTemp = new CtiCompletionBean();
		CtiCompletionBean comPart = new CtiCompletionBean();
		CtiCompletionBean compBean = null;
		CtiCompletionBean compTemp = new CtiCompletionBean();
		if ( (allCompVec.size() > 0) && (allCompVec != null)) { 
			for (int i=0; i < allCompVec.size(); i++ ) {
				compTemp = (CtiCompletionBean)allCompVec.get(i);
				
				System.out.println("comp Code = " + compTemp.getCopmletionSeqCode());
				
				calcCompVec = getCtiShiftForComp(compTemp); // 8552 - insert time change for Sap
				if ( (calcCompVec.size()< 1) || (calcCompVec == null) ) {
					//אם לא נמצאו משמרות חופפות להשלמה, ההשלמה נכנסת במלואה
					insertCompletionParts(compTemp);
					updateCompletionCalcedStatus(compTemp, ShfBatchConstants.completionCalcedSTATUS);
				} else {
					//אחרת יש לפצל את ההשלמות לפי המשמרות החופפות
					comPartTemp = new CtiCompletionBean();
					calcPart = new Vector();
	
					for (int l=0; l < calcCompVec.size(); l++ ) {
						long z1, z2, x1, x2, y1, y2, X1, Y1, X2, Y2 = 0;
						compBean = (CtiCompletionBean)calcCompVec.get(l);
						y2 = compBean.getCtiShiftEnd().getTime();
						x2 = compBean.getCtiShiftStart().getTime();
	
						if (comPartTemp.getCopmletionStartCalc() == null) {
							x1 = compBean.getCopmletionStart().getTime();
						} else {
							x1 = comPartTemp.getCopmletionStartCalc().getTime();
						}
						
						if (comPartTemp.getCopmletionEndCalc() == null) {
							y1 = compBean.getCopmletionEnd().getTime();
						} else {
							y1 = comPartTemp.getCopmletionEndCalc().getTime();
						}
						
						comPartTemp = getCopmletionParts(x1, y1, x2, y2);
						if (comPartTemp.getCopmletionStart() != null) {
							comPart = new CtiCompletionBean();
							comPart.setCopmletionStart(comPartTemp.getCopmletionStart());
							comPart.setCopmletionEnd(comPartTemp.getCopmletionEnd());
							comPart.setCopmletionSeqCode(compBean.getCopmletionSeqCode());
							calcPart.add(comPart);	
						}
						System.out.println("End ");
					}
					
					if (comPartTemp.getCopmletionStartCalc() != null) {
						comPart = new CtiCompletionBean();
						comPart.setCopmletionStart(comPartTemp.getCopmletionStartCalc());
						comPart.setCopmletionEnd(comPartTemp.getCopmletionEndCalc());
						comPart.setCopmletionSeqCode(compBean.getCopmletionSeqCode());
						comPart.setEmpId(compBean.getEmpId());
						calcPart.add(comPart);	
					}
					
					CtiCompletionBean bean=null;
					for (int ii=0; ii<calcPart.size(); ii++){
						bean = (CtiCompletionBean)calcPart.get(ii);
						System.out.println("part comp " + ii + " start: " + bean.getCopmletionStart() + " , end: " +  bean.getCopmletionEnd());
						insertCompletionParts(bean);
					}
					if ( (calcPart.size() > 0) && (calcPart != null)) {
						updateCompletionCalcedStatus(bean, ShfBatchConstants.completionCalcedSTATUS);
					}
				}					
			}
			
		}
	}

	/**
	 * @param i
	 */
	private void updateCompletionCalcedStatus(CtiCompletionBean bean,int i) throws ShfException {
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS  ");
		sql.append(" SET SAP_STATUS = ? "); // 1
		sql.append(" WHERE COPMLETION_SEQ_CODE = ? "); // 2
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, i); // 1
			getDbAccess().setLong(param_index++,bean.getCopmletionSeqCode()); // 3
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCompletionCalcedStatus", e);
		}	
		
	}

	/**
	 * @param bean
	 */
	private void insertCompletionParts(CtiCompletionBean bean) throws ShfException {
		System.out.println("insertCompletionParts()  " + bean.getCopmletionSeqCode() + " " + bean.getCopmletionStart());
		int param_index=1;

		StringBuffer sql=new StringBuffer();

		sql.append(" INSERT INTO SHIFTER.SHF_CTI_EMP_COMPLETION_PARTS "); 
		sql.append("             ( COPMLETION_SEQ_CODE, COMPLETION_PART_START, COMPLETION_PART_END, UPDATE_DATE ) ");
		sql.append("      VALUES (?, ?, ?, ?) ");
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, bean.getCopmletionSeqCode()); //COPMLETION_SEQ_CODE
			getDbAccess().setTimestamp(param_index++,bean.getCopmletionStart());// COMPLETION_PART_START
			getDbAccess().setTimestamp(param_index++, bean.getCopmletionEnd()); // COMPLETION_PART_END
			getDbAccess().setTimestamp(param_index++, new Date()); //UPDATE_DATE

			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertCompletionParts() : ", e);
		}		
	}

	/**
	 * @param x1
	 * @param y1
	 * @param x2
	 * @param y2
	 */
	private CtiCompletionBean getCopmletionParts(long x1, long y1, long x2, long y2) {
		//חישוב מקטעי השלמות שאינם חופפים עם זמני משמרות
		CtiCompletionBean comPart = new CtiCompletionBean();
		long z1=0, z2=0, X1=0, Y1=0, X2=0, Y2=0;
		z1 = x2 - x1;
		z2 = y1 - y2;
							
		X1 = x1;
		Y1 = X1 + z1;
							
		X2 = y2;
		Y2 = X2 + z2; 
		Date Dx1 = new Date();
		Date Dy1 = new Date();
		Date Dx2 = new Date();
		Date Dy2 = new Date();

		Dx1.setTime(X1);
		Dy1.setTime(Y1);
		
		Dx2.setTime(X2);
		Dy2.setTime(Y2);
		if (Y1 - X1 > 0) {
			comPart.setCopmletionStart(Dx1);
			comPart.setCopmletionEnd(Dy1);
			}
	   if (Y2 - X2 > 0) {
			comPart.setCopmletionStartCalc(Dx2);
			comPart.setCopmletionEndCalc(Dy2);
	   }
	   return comPart;
	}
	/**
	 * @return
	 */
	private Vector getCtiShiftForComp(CtiCompletionBean completionBean) throws ShfException {
		System.out.println("getCtiShiftForComp()");
		Vector recs = new Vector();
		int param_index=1;
		int minDiff = Integer.parseInt(SHFParameters.getMinDiffBetweenCopletionAndCtiShifts(null).getValue());
		
		StringBuffer sql=new StringBuffer();
	
		sql.append(" SELECT C.COPMLETION_SEQ_CODE, C.COPMLETION_START, C.COPMLETION_END, S.CTI_SHIFT_ID,  ");
		sql.append("        NVL(S.CTI_SHIFT_START_REWARD, S.CTI_SHIFT_START) - ?/86400 CTI_SHIFT_START, NVL(S.CTI_SHIFT_END_REWARD, S.CTI_SHIFT_END) + ?/86400 CTI_SHIFT_END ");
		sql.append("   FROM SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS C, SHIFTER.SHF_CTI_SHIFTS S ");
		sql.append("  WHERE C.EMP_ID = S.EMP_ID ");
		sql.append("    AND C.COPMLETION_SEQ_CODE = ? ");
		sql.append("    AND ( ");
		sql.append("          ( (C.COPMLETION_START <= NVL(S.CTI_SHIFT_START_REWARD, S.CTI_SHIFT_START) - ?/86400) AND ( C.COPMLETION_END >= NVL(S.CTI_SHIFT_END_REWARD, S.CTI_SHIFT_END) + ?/86400 ) ) ");
		sql.append("         OR ");
		sql.append("          ( C.COPMLETION_START BETWEEN  NVL(S.CTI_SHIFT_START_REWARD, S.CTI_SHIFT_START) - ?/86400 AND NVL(S.CTI_SHIFT_END_REWARD, S.CTI_SHIFT_END) + ?/86400 )  ");
		sql.append("         OR ");
		sql.append("          ( C.COPMLETION_END BETWEEN  NVL(S.CTI_SHIFT_START_REWARD, S.CTI_SHIFT_START) - ?/86400 AND NVL(S.CTI_SHIFT_END_REWARD, S.CTI_SHIFT_END) + ?/86400 ) ");
		sql.append("        ) ");
		sql.append("  ORDER BY NVL(S.CTI_SHIFT_START_REWARD, S.CTI_SHIFT_START), S.CTI_SHIFT_ID ");
		
		try{
			CtiCompletionBean compBean=null;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setLong(param_index++, completionBean.getCopmletionSeqCode());
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
			getDbAccess().setInt(param_index++, minDiff);
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				compBean=new CtiCompletionBean();
				getDbAccess().populate(compBean);
				//System.out.println("shift start time : " + compBean.getCti_shift_start() + ",  end time :" + compBean.getCti_shift_end() );
				recs.add(compBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getCtiShiftForComp");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getCtiShiftForComp : ", e);
		}

		return recs;
	}

	/**
	 * @return
	 */
	private Vector getAllCompletionForSap() throws ShfException {
		System.out.println("getAllCompletionForSap()");
		Vector recs = new Vector();
		int param_index=1;
		Date lastProcessDate = null;
		
		lastProcessDate = getLastRunDate();
		StringBuffer sql=new StringBuffer();
	
		sql.append("SELECT 	 COPMLETION_SEQ_CODE, COPMLETION_START, COPMLETION_END ");
		sql.append("  FROM  SHIFTER.SHF_CTI_EMPLOYEE_COMPLETIONS ");
		sql.append(" WHERE SAP_STATUS = ?   ");
		sql.append("   AND COPMLETION_END <= ?");
		sql.append("   AND SAP_REQ_ID IS NULL ");
		sql.append(" ORDER BY COPMLETION_SEQ_CODE ");
		
		try{
			CtiCompletionBean completionBean=null;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.completionNotCalcedSTATUS);
			getDbAccess().setTimestamp(param_index++, lastProcessDate);
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				completionBean=new CtiCompletionBean();
				getDbAccess().populate(completionBean);
				recs.add(completionBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getAllCompletionForSap");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCompletionForSap : ", e);
		}

		return recs;
	}

	private Date getMaxProcessDate() {
		Date maxDate = null;
		
		return maxDate;
	}

	/**
	 * 
	 */
	private void sapCtiShiftFile() throws ShfException {
		Vector ctiShiftForSap = getAllCtiShiftForSap();
		if ( (ctiShiftForSap.size() > 0) && (ctiShiftForSap != null)) {
			prapareCtiShiftSapFile(ctiShiftForSap);
		} else {
			tracerLogger.info("**** NO CTI-SHIFT DATA FOR PROCESS ****");
		}
	}

	/**
	 * @return
	 */
	private long getSapReqId() throws ShfException {
		System.out.println("getSapReqId()");
		
		long lastKey; 
		lastKey = 0;
		StringBuffer sql=new StringBuffer();
		sql.append("select shifter.shf_cti_sap_req_id.nextval from dual ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().executeQuery();
			getDbAccess().next();
			lastKey = getDbAccess().getLong(1);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("geNextKeyValue", e);
		}
		
		return lastKey;
	} 

	/**
	 * @param ctiShiftForSap
	 */
	private void prapareCtiShiftSapFile(Vector ctiShiftForSap) throws ShfException {
		CtiShiftBean ctiBean=null;
		String sapLine;
		boolean forFile = false;
		Map<String, String> usersMap = new HashMap<String, String>();
		for(int i =0; i <ctiShiftForSap.size() /* && i<100*/; i++) {
			SapCtiShiftLineBean sapLinebean = null;
			ctiBean = (CtiShiftBean)ctiShiftForSap.get(i);
			forFile = false;
			sumCtiShiftFoundForSap++;
			usersMap.put(ctiBean.getEmp_id(), ctiBean.getEmp_id());
			
			if ( (ctiBean.get_cti_start() != null) && (ctiBean.getEmp_id().length() == 8)) {
				sapLinebean = new SapCtiShiftLineBean(ctiBean, ShfBatchConstants.Sap_Line_IN);
				System.out.println(sapLinebean);
				writer.println(sapLinebean);
				forFile = true;
				sumShiftLineForSapFile++;
			}
			if ( (ctiBean.get_cti_end() != null) && (ctiBean.getEmp_id().length() == 8) ) {			
				sapLinebean = new SapCtiShiftLineBean(ctiBean, ShfBatchConstants.Sap_Line_OUT);
				System.out.println(sapLinebean);
				writer.println(sapLinebean);
				forFile = true;
				sumShiftLineForSapFile++;
			}
			if (forFile) {
				System.out.println("valid for file, updating to CtiSapDeliveredSTATUS, cti_shift_id= " + ctiBean.cti_shift_id);
				if (ctiBean.getHandle_status() == ShfBatchConstants.CtiShiftNoStartSTATUS) { sumShiftForSapNoStart ++;	}
				if (ctiBean.getHandle_status() == ShfBatchConstants.CtiShiftNoEndSTATUS) {	sumShiftForSapNoEnd++;	}
				if (ctiBean.getHandle_status() == ShfBatchConstants.CtiShiftTooLongSTATUS) { sumShiftForSapTooLong++; }

				sumShiftForSap++;
				updateCtiShiftForSap(ctiBean, ShfBatchConstants.CtiSapDeliveredSTATUS);
			} else {
				sumNotOkShift++;
				updateCtiShiftForSap(ctiBean, ShfBatchConstants.CtiSapNotOkSTATUS);
			}
			
		}
		sumUsersToSap = usersMap.size();
	}


	/**
	 * @param ctiShiftForSap
	 */
	private void updateCtiShiftForSap(CtiShiftBean ctiBean, int status) throws ShfException {
		System.out.println("updateCtiShiftForSap(), status :"+ status + ", sapReqId: "+sapReqId+", cti_shift_id: "+ctiBean.getCti_shift_id());
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS  ");
		sql.append(" SET SAP_STATUS = ?, "); // 1
		sql.append(" SAP_REQ_ID = ? "); // 2
		sql.append(" WHERE CTI_SHIFT_ID = ? "); // 3
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, status); // 1
			getDbAccess().setLong(param_index++,sapReqId); // 2
			getDbAccess().setLong(param_index++,ctiBean.getCti_shift_id()); // 3
			getDbAccess().executeUpdate();
			System.out.println("updateCtiShiftForSap() update executed !");
		}catch(DBException e){
			System.out.println("updateCtiShiftForSap() update NOT executed !");

			e.printStackTrace();
			throw new ShfException("updateCtiShiftWithShfDayId", e);
		}	
	}
	/**
	 * @return
	 */
	private Vector getAllCtiShiftForSap() throws ShfException {
		System.out.println("getAllCtiShiftForSap()");
		Vector recs = new Vector();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();

		sql.append("SELECT CTI_SHIFT_ID, EMP_ID, CTI_SHIFT_START_REWARD, CTI_SHIFT_START, CTI_SHIFT_END_REWARD, CTI_SHIFT_END, HANDLE_STATUS "); 
		sql.append("  		  FROM SHIFTER.SHF_CTI_SHIFTS , SHIFTER.SHF_EMPLOYEES E  ");
		sql.append(" WHERE  CREDIT_STATUS = ?   ");
		sql.append("   AND  EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) ");
		sql.append("   AND  SAP_STATUS = ?   ");
		sql.append("   AND  E.OPTIONAL1 = ? ");
		sql.append("   AND (HANDLE_STATUS = ? OR HANDLE_STATUS = ? OR HANDLE_STATUS = ? OR HANDLE_STATUS = ? )");
		sql.append("   AND (E.STATUS_ID = ? OR E.STATUS_ID = ?) ");
		try{
			CtiShiftBean ctiBean=null;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditCalcedSTATUS); //CREDIT_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapNotDeliveredSTATUS); // SAP_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapToDeliver); // OPTIONAL1
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftOkSTATUS); // HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftNoStartSTATUS); // HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftNoEndSTATUS); // HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiShiftTooLongSTATUS); // HANDLE_STATUS
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeActiveStatus); // EMPLOYEE STATUS_ID
			getDbAccess().setInt(param_index++, ShfBatchConstants.EmployeeTempNotActiveStatus); // EMPLOYEE STATUS_ID
			
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiBean=new CtiShiftBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getAllCtiShiftForSystemCredit");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiShiftForSystemCredit : ", e);
		}

		return recs;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	protected void finishProcess() throws ShfException {
		String str;
		char newLine = 13;
//		freeJobTableUpdate();
		sumRecScaned = sumCtiShiftFoundForSap + sumCompletionFoundForSap;
		ctiDocBean.setRecordsScanned( new Integer(sumRecScaned) );
		ctiDocBean.setRecordsAdded(new Integer(sumShiftForSap + sumCompletionForSap));
		ctiDocBean.setRecordsInvalid(new Integer(sumNotOkShift + sumNotOkCompletion));
		ctiDocBean.setSapReqId(sapReqId);
		ctiDocBean.setP2_4_OkShift(sumShiftForSap);
		ctiDocBean.setP2_4_ShiftNoStart(sumShiftForSapNoStart);
		ctiDocBean.setP2_4_ShiftNoEnd(sumShiftForSapNoEnd);
		ctiDocBean.setP2_4_LongShift(sumShiftForSapTooLong);
		ctiDocBean.setP4SumUsers(sumUsersToSap);
		
		insertDocs(ctiDocBean);
		writer.flush();
		try {
			fs.close();
			writer.close();
		} catch (IOException e) {
			tracerLogger.error("initOutputFile() " + e.getMessage());
			throw new ShfException("error create output file ", e);

		}
		
		str = " -*-*-*-*-*-*-* SUMMARY OF CREATE SAP FILE *-*-*-*-*-*-*-*-" + newLine;
		tracerLogger.info(str);
		str = "sumRecScaned : " + sumRecScaned + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumCtiShiftFoundForSap : " + sumCtiShiftFoundForSap + newLine;
		tracerLogger.info(str);
		str = "sumCompletionFoundForSap : " + sumCompletionFoundForSap + newLine;
		tracerLogger.info(str);
		
		str = "-=-=-=SHIFTS=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumShiftForSap : " + sumShiftForSap + newLine;
		tracerLogger.info(str);
		str = "sumNotOkShift : " + sumNotOkShift + newLine;
		tracerLogger.info(str);
		str = "sumShiftLineForSapFile : " + sumShiftLineForSapFile + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "-=-=-=COMPLETIONS=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumCompletionForSap : " + sumCompletionForSap + newLine;
		tracerLogger.info(str);
		str = "sumNotOkCompletion : " + sumNotOkCompletion + newLine;
		tracerLogger.info(str);
		str = "sumCompletionLineForSapFile : " + sumCompletionLineForSapFile + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=" + newLine;
		tracerLogger.info(str);
		str = "Sum Line For Sap File: " + (sumCompletionLineForSapFile + sumShiftLineForSapFile) + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=" + newLine;
		tracerLogger.info(str);
		checkFileCompletion(sumCompletionLineForSapFile + sumShiftLineForSapFile);
	}

	private void checkFileCompletion(int excpectedLines) throws ShfException {
		// TODO Auto-generated method stub
		
		char newLine = 13;
		FileUtil fileUtil = new FileUtil();
		byte[] data = null;
		try {
			data = fileUtil.readFile(OutputFileName);
			int actualLines =   fileUtil.getNumOfLines(data, true);
			tracerLogger.info("actualLines = " + actualLines);
			if (actualLines < excpectedLines || actualLines <=0) {
				FileUtil.fileCopy(OutputFileName, ErrorFileName);
				//fileUtil.deleteFile(OutputFileName);
				ShfException e = new ShfException("checkFileCompletion() excpected = " + excpectedLines + " actualLines :" + actualLines);
				tracerLogger.info(newLine + "checkFileCompletion Ended NOT OK" + newLine);
				tracerLogger.info(newLine +  "checkFileCompletion() excpected = " + excpectedLines + " actualLines :" + actualLines + newLine);
				tracerLogger.error(e.getMessage());
				throw e;
			}
			
			
		} catch (Exception e1) {
			// TODO Auto-generated catch block
			tracerLogger.error("ERROR ON fileUtil.readFile Function " + e1.getMessage());
			throw new ShfException( "fileUtil.readFile " + e1.getMessage());
		}
		
		tracerLogger.info(newLine + "checkFileCompletion Ended OK" + newLine);
		
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
		OutputFileName = processBean.getOutputFileDir() + "SH" + BaseConvert.dateToString(new Date(),"yyMMdd") + ".txt";
		ErrorFileName = processBean.getErrorFileDir() + processBean.getErrorFileName() + "SH" + BaseConvert.dateToString(new Date(),"yyMMdd") + ".txt";
		try {
			fs = new FileOutputStream(OutputFileName, false);
			writer = new PrintWriter(fs);
			
			fsError = new FileOutputStream(ErrorFileName, false);
			errorWriter = new PrintWriter(fsError);
			
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

	}
	
	
	  /**
	   * Writes a file to the disk.
	   * @param filename The name of the output file.
	   * @param data The file data.
	   */
	  public void writeFile(String filename, byte[] data) throws Exception {
		  try {
			  FileOutputStream fos = new FileOutputStream(filename);
			  fos.write(data);
			  fos.close();
		  } catch (Exception e) {
			throw new Exception("Error writing file"+filename+" Error: " + e.getMessage());
		  }
	  }

}