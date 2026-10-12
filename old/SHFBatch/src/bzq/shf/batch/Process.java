package bzq.shf.batch;

import java.sql.SQLException;
import java.util.Calendar;
import java.util.Date;
import java.util.Vector;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.batch.beans.BatchDocBean;

/**
 * @author 30610488
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
/**
 * Insert the type's description here.
 * Creation date: (15/05/2003 13:55:25)
 * @author: Eduard Katcherovski
 */
public class Process {

	private BatchDocBean batchDocBean = null;
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:01:49)
	 * @param batchDocBean mdr.beans.BatchDocBean
	 */
	public Process(BatchDocBean batchBean) throws SQLException {
		super();
		batchDocBean = batchBean;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/01/2002 11:15:04)
	 */
	public void erase() throws DBException {

		// validateCodeTable();
		DBAccess dbAccess = new DBAccess();

		StringBuffer sql = new StringBuffer();

		sql.append("DELETE FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE ( PROCESS_DOC_KEY = ? )");

		try {
			dbAccess.prepareStatement(sql.toString());
			dbAccess.setLong(1, batchDocBean.getProcessDocKey());
			dbAccess.executeUpdate();

		} catch (DBException dbe) {
			dbAccess.rollback();
		} finally {
			try {
				dbAccess.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/01/2002 11:15:04)
	 */
	public void get() throws DBException, Exception {

		String sql =
			"SELECT PROCESS_DOC_KEY, SHF_BATCH_DOCS.PROCESS_KEY, EXEC_DATE, TRIGGER_DATE, GEN_NUMBER, ";
		sql
			+= " REC_SCANED, REC_ADDED, REC_MODIFIED, REC_DELETED, REC_INVALID, PROCESS_STATUS,";
		sql
			+= " OPERATION_PRM, LAST_COMMIT_REC, STEP_IN_PROGRESS, FILE_NAME, SOURCE_KEY, DOC_DESC,";
		sql += " PROCESS_DESC";
		sql += " FROM SHIFTER.SHF_BATCH_DOCS, SHIFTER.SHF_BATCH_PROCESS";
		sql += " WHERE (PROCESS_DOC_KEY = ?) AND";
		sql += " (SHF_BATCH_DOCS.PROCESS_KEY = SHF_BATCH_PROCESS.PROCESS_KEY) ";

		DBAccess dbAccess = null;
		try {
			dbAccess = new DBAccess();
			dbAccess.prepareStatement(sql.toString());
			dbAccess.setLong(1, batchDocBean.getProcessDocKey());

			dbAccess.executeQuery();
			dbAccess.populate(batchDocBean);

		} catch (bzq.db.DBQueryNoRowsException e) {
			//ActionErrors actionErrors = new ActionErrors();
			//actionErrors.add("codeTable", new ActionError(CODE_NOT_FOUND));	
			//throw new MdrException(actionErrors);	
		} finally {
			try {
				dbAccess.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @return java.lang.String
	 */
	public java.util.Date getExecDate(DBAccess dbAccess) throws Exception {
		Date execDate = null;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.EXEC_DATE FROM SHF_BATCH_DOCS ");
		sql.append(" WHERE SHIFTER.PROCESS_DOC_KEY=");
		sql.append(batchDocBean.getProcessDocKey());

		dbAccess.prepareStatement(sql.toString());
		dbAccess.executeQuery();
		execDate = dbAccess.getTimestamp(1);

		return execDate;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @return java.lang.String
	 */
	public java.lang.String getFileName(DBAccess dbAccess) throws Exception {
		String fileName = null;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.FILE_NAME FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		fileName = dbAccess.getString(1);

		return fileName;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/06/2003 13:58:08)
	 * @return int
	 */
	public void getFirstReadyProcessRow(DBAccess dbAccess) throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append("select EXEC_DATE AS EXEC_DATE,");
		sql.append(" PROCESS_DOC_KEY as PROCESS_DOC_KEY,");
		sql.append(" PROCESS_KEY as PROCESS_KEY,");
		sql.append(" TRIGGER_DATE as TRIGGER_DATE,");
		sql.append(" GEN_NUMBER as GEN_NUMBER,");
		sql.append(" REC_SCANED as REC_SCANED,");
		sql.append(" REC_ADDED as REC_ADDED,");
		sql.append(" REC_MODIFIED as REC_MODIFIED,");
		sql.append(" REC_DELETED as REC_DELETED,");
		sql.append(" REC_INVALID as REC_INVALID,");
		sql.append(" OPERATION_PRM as OPERATION_PRM,");
		sql.append(" LAST_COMMIT_REC as LAST_COMMIT_REC,");
		sql.append(" STEP_IN_PROGRESS as STEP_IN_PROGRESS,");
		sql.append(" FILE_NAME as FILE_NAME,");
		sql.append(" SOURCE_KEY as SOURCE_KEY,");
		sql.append(" DOC_DESC as DOC_DESC,");
		sql.append(" PROCESS_STATUS AS PROCESS_STATUS ");
		sql.append(" from SHIFTER.SHF_BATCH_DOCS where PROCESS_KEY =? and  ");
		sql.append(" PROCESS_STATUS=? and TRIGGER_DATE=");
		sql.append(" (select min(TRIGGER_DATE) ");
		sql.append(" from SHIFTER.SHF_BATCH_DOCS where PROCESS_KEY = ? and ");
		sql.append(" PROCESS_STATUS=?) ");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, batchDocBean.getProcessKey());
		dbAccess.setString(2, "R");
		dbAccess.setInteger(3, batchDocBean.getProcessKey());
		dbAccess.setString(4, "R");
		dbAccess.executeQuery();
		dbAccess.populate(batchDocBean);
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/05/2003 16:23:26)
	 */
	public int getLastCompleteGenNumber() throws Exception {
		DBAccess dbAccess = new DBAccess();
		int result = 0;

		try {
			result = getLastCompleteGenNumber(dbAccess);
		} catch (DBQueryNoRowsException e) {
			return result;
		} finally {
			try {
				dbAccess.close();
			} catch (DBException ex) {
				ex.printStackTrace();

			}
		}

		return result;
	}

	/*Syncronize version between two processes shell
	* 
	*/
	public int getLastCompleteGenNumber(
		Integer processKey1,
		Integer processKey2)
		throws Exception {
		DBAccess dbAccess = new DBAccess();
		int result = 0;

		try {
			result =
				getLastCompleteGenNumber(dbAccess, processKey1, processKey2);
		} catch (DBQueryNoRowsException e) {
			return result;
		} finally {
			try {
				dbAccess.close();
			} catch (DBException ex) {
				ex.printStackTrace();

			}
		}

		return result;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/06/2003 13:58:08)
	 * @return int
	 */
	public int getLastCompleteGenNumber(DBAccess dbAccess) throws Exception {
		int genNum = -1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.GEN_NUMBER FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_KEY=? and EXEC_DATE=");
		sql.append("(select max(SHF_BATCH_DOCS.EXEC_DATE)");
		sql.append("from SHF_BATCH_DOCS where ");
		sql.append(" PROCESS_STATUS=? and PROCESS_KEY=?)");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, batchDocBean.getProcessKey());
		dbAccess.setString(2, "C");
		dbAccess.setInteger(3, batchDocBean.getProcessKey());
		dbAccess.executeQuery();
		genNum = dbAccess.getInt(1);

		return genNum;
	}

	/*Syncronize version between two processes
	 * 
	 * */
	public int getLastCompleteGenNumber(
		DBAccess dbAccess,
		Integer processKey1,
		Integer processKey2)
		throws Exception {
		int genNum = -1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT MAX(GEN_NUMBER) FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_KEY IN(?,?) and EXEC_DATE=");
		sql.append("(select max(SHF_BATCH_DOCS.EXEC_DATE)");
		sql.append("from SHIFTER.SHF_BATCH_DOCS where ");
		sql.append(" PROCESS_STATUS=? and PROCESS_KEY IN (?,?))");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, processKey1);
		dbAccess.setInteger(2, processKey2);
		dbAccess.setString(3, "C");
		dbAccess.setInteger(4, processKey1);
		dbAccess.setInteger(5, processKey2);
		dbAccess.executeQuery();
		genNum = dbAccess.getInt(1);

		return genNum;
	}

	/*Syncronize Execution dates between two processes
	 * 
	 * */
	public Date getMaxCompleteExecDate(
		DBAccess dbAccess,
		Integer processKey1,
		Integer processKey2)
		throws Exception {
		Date execDate = new Date();
		StringBuffer sql = new StringBuffer();
		sql.append(" select max(SHF_BATCH_DOCS.EXEC_DATE)");
		sql.append(" from SHIFTER.SHF_BATCH_DOCS where ");
		sql.append(" PROCESS_STATUS=? and PROCESS_KEY IN (?,?)");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setString(1, "C");
		dbAccess.setInteger(2, processKey1);
		dbAccess.setInteger(3, processKey2);
		dbAccess.executeQuery();
		execDate = dbAccess.getDate(1);

		return execDate;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/06/2003 13:58:08)
	 * @return int
	 */
	public void getLastCompleteProcessRow(DBAccess dbAccess) throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append("select EXEC_DATE AS EXEC_DATE,");
		sql.append(" PROCESS_DOC_KEY as PROCESS_DOC_KEY,");
		sql.append(" PROCESS_KEY as PROCESS_KEY,");
		sql.append(" TRIGGER_DATE as TRIGGER_DATE,");
		sql.append(" GEN_NUMBER as GEN_NUMBER,");
		sql.append(" REC_SCANED as REC_SCANED,");
		sql.append(" REC_ADDED as REC_ADDED,");
		sql.append(" REC_MODIFIED as REC_MODIFIED,");
		sql.append(" REC_DELETED as REC_DELETED,");
		sql.append(" REC_INVALID as REC_INVALID,");
		sql.append(" OPERATION_PRM as OPERATION_PRM,");
		sql.append(" LAST_COMMIT_REC as LAST_COMMIT_REC,");
		sql.append(" STEP_IN_PROGRESS as STEP_IN_PROGRESS,");
		sql.append(" FILE_NAME as FILE_NAME,");
		sql.append(" SOURCE_KEY as SOURCE_KEY,");
		sql.append(" DOC_DESC as DOC_DESC,");
		sql.append(" PROCESS_STATUS AS PROCESS_STATUS ");
		sql.append(" from SHIFTER.SHF_BATCH_DOCS where PROCESS_KEY =? and  ");
		sql.append(
			" PROCESS_STATUS=? and EXEC_DATE = ( select max(EXEC_DATE) ");
		sql.append(" from SHIFTER.SHF_BATCH_DOCS where PROCESS_KEY = ? and ");
		sql.append(" PROCESS_STATUS=?)");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, batchDocBean.getProcessKey());
		dbAccess.setString(2, "C");
		dbAccess.setInteger(3, batchDocBean.getProcessKey());
		dbAccess.setString(4, "C");
		dbAccess.executeQuery();
		dbAccess.populate(batchDocBean);
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @return java.lang.String
	 */
	public java.lang.String getProcessStatus(DBAccess dbAccess)
		throws Exception {
		String processStatus = null;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.PROCESS_STATUS FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		processStatus = dbAccess.getString(1);

		return processStatus;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:23)
	 * @return int
	 */
	public int getRecordsAdded(DBAccess dbAccess) throws Exception {
		int recordsAdded = -1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.REC_ADDED FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		recordsAdded = dbAccess.getInt(1);

		return recordsAdded;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:52)
	 * @return int
	 */
	public int getRecordsDeleted(DBAccess dbAccess) throws Exception {
		int recordsDeleted = -1;
		try {
			StringBuffer sql = new StringBuffer();
			sql.append("SELECT SHF_BATCH_DOCS.REC_DELETED FROM SHIFTER.SHF_BATCH_DOCS ");
			sql.append(" WHERE PROCESS_DOC_KEY=?");
			sql.append(batchDocBean.getProcessDocKey());

			dbAccess.prepareStatement(sql.toString());
			dbAccess.setLong(1, batchDocBean.getProcessDocKey());
			dbAccess.executeQuery();
			recordsDeleted = dbAccess.getInt(1);
		} catch (Exception e) {
			System.out.println(e.toString());
		}

		return recordsDeleted;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:28:30)
	 * @return int
	 */
	public int getRecordsInvalid(DBAccess dbAccess) throws Exception {
		int recordsInvalid = -1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.REC_INVALID FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		recordsInvalid = dbAccess.getInt(1);

		return recordsInvalid;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (20/05/2003 11:05:06)
	 * @return int
	 */
	public int getRecordsModified(DBAccess dbAccess) throws Exception {
		int recordsModified = -1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.REC_MODIFIED FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		recordsModified = dbAccess.getInt(1);
		return recordsModified;
	}
	/**
	 * Getting daily processes report
	 * for complete,run,or pending status
	 * Creation date: (27/01/2002 14:53:58)
	 * @return java.util.Vector
	 * S.F.
	 * @exception bzq.db.DBException The exception description.
	 */
	public static java.util.Vector getLastProcesses()
		throws bzq.db.DBException {
		int lastDay = -1;
		//Getting Yesterday date
		Calendar gCal = java.util.GregorianCalendar.getInstance();

		//If sunday - show 3 days ago
		if (gCal.get(Calendar.DAY_OF_WEEK) == 1) {
			lastDay = -3;
		}
		gCal.add(java.util.Calendar.DATE, lastDay);

		StringBuffer sql = new StringBuffer();
		sql.append(" SELECT ");
		sql.append(" a.PROCESS_DOC_KEY, ");
		sql.append(" a.PROCESS_KEY,");
		sql.append(" p.PROCESS_DESC AS PROCESS_DESC, ");
		sql.append(" a.EXEC_DATE, ");
		sql.append(" a.TRIGGER_DATE,");
		sql.append(" a.PROCESS_STATUS,");
		sql.append(" a.GEN_NUMBER, ");
		sql.append(" a.REC_SCANED,");
		sql.append(" a.REC_ADDED,");
		sql.append(" a.REC_MODIFIED,");
		sql.append(" a.REC_DELETED,");
		sql.append(" a.REC_INVALID,");
		sql.append(" a.OPERATION_PRM,");
		sql.append(" a.FILE_NAME,");
		sql.append(" a.DOC_DESC");
		sql.append(" FROM");
		sql.append(" SHIFTER.SHF_BATCH_DOCS a, SHIFTER.SHF_BATCH_PROCESS p");
		sql.append(" WHERE  a.PROCESS_KEY = p.PROCESS_KEY ");
		sql.append(" AND (a.EXEC_DATE > to_date(?, 'dd/MM/yyyy')");
		sql.append(" OR a.PROCESS_STATUS IN ('R','P'))");
		sql.append(" ORDER BY EXEC_DATE ");
		Vector table = new Vector();
		DBAccess dbAccess = null;
		try {
			dbAccess = new DBAccess();
			dbAccess.prepareStatement(sql.toString());
			dbAccess.setDate(1, gCal.getTime());
			dbAccess.executeQuery();
			dbAccess.populate("som.batch.beans.BatchDocBean", table);
		} finally {
			dbAccess.close();
		}
		return table;
	}

	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:28:48)
	 * @return int
	 */
	public int getRecordsScanned(DBAccess dbAccess) throws Exception {
		int recordsScanned = -1;

		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.REC_SCANED FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeQuery();
		recordsScanned = dbAccess.getInt(1);
		return recordsScanned;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (27/01/2002 14:53:58)
	 * @return java.util.Vector
	 * @param tableName java.lang.String
	 * @param codeName java.lang.String
	 * @param descriptionName java.lang.String
	 * @exception bzq.db.DBException The exception description.
	 */
	public java.util.Vector getRows() throws bzq.db.DBException {

		String sql =
			"SELECT SHF_BATCH_PROCESS.PROCESS_KEY, PROCESS_DOC_KEY, EXEC_DATE, TRIGGER_DATE, GEN_NUMBER, PROCESS_STATUS,";
		sql
			+= " SHF_BATCH_PROCESS.PROCESS_DESC, SHF_BATCH_DOCS.DOC_DESC,SHF_BATCH_DOCS.OPERATION_PRM";
		sql += " FROM SHIFTER.SHF_BATCH_DOCS, SHIFTER.SHF_BATCH_PROCESS";
		sql
			+= " WHERE (SHF_BATCH_DOCS.PROCESS_KEY = SHF_BATCH_PROCESS.PROCESS_KEY) AND";
		sql += " (SHF_BATCH_PROCESS.PROCESS_KEY = ?)";
		sql += " ORDER BY TRIGGER_DATE DESC";

		Vector table = new Vector();
		DBAccess dbAccess = null;
		try {
			dbAccess = new DBAccess();
			dbAccess.prepareStatement(sql.toString());
			dbAccess.setInteger(1, batchDocBean.getProcessKey());
			dbAccess.executeQuery();
			dbAccess.populate("som.batch.beans.BatchDocBean", table);
		} finally {
			dbAccess.close();
		}
		return table;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @return java.lang.String
	 */
	public java.util.Date getTriggerDate(DBAccess dbAccess) throws Exception {
		java.util.Date triggerDate = null;

		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_BATCH_DOCS.TRIGGER_DATE FROM SHIFTER.SHF_BATCH_DOCS ");
		sql.append(" WHERE PROCESS_DOC_KEY=");
		sql.append(batchDocBean.getProcessDocKey());

		dbAccess.prepareStatement(sql.toString());
		dbAccess.executeQuery();
		triggerDate = dbAccess.getTimestamp(1);

		return triggerDate;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (14/12/2003 15:55:40)
	 * @return boolean
	 */
	public boolean ifHasReadyProcess(Integer prKey) throws Exception {

		DBAccess dbAccess = new DBAccess();
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT * FROM mdr_batch_doc");
		sql.append(" where process_key =? ");
		sql.append(" and process_status=? ");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, prKey);
		dbAccess.setString(2, "R");
		try {

			dbAccess.executeQuery();
			return true;
		} catch (DBQueryNoRowsException e) {

			return false;
		} finally {
			dbAccess.close();
		}

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (14/12/2003 15:55:40)
	 * @return boolean
	 */
	public boolean ifHasReadyProcess(Integer prKey, DBAccess dbAccess)
		throws Exception {

		StringBuffer sql = new StringBuffer();
		sql.append("SELECT * FROM SHIFTER.SHF_BATCH_DOCS");
		sql.append(" where process_key =? ");
		sql.append(" and process_status=? ");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInteger(1, prKey);
		dbAccess.setString(2, "R");
		try {

			dbAccess.executeQuery();
			return true;
		} catch (DBQueryNoRowsException e) {

			return false;
		}
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/05/2003 16:23:26)
	 */
	public void initRowBatchDocBean() throws Exception {
		DBAccess dbAccess = new DBAccess();
		try {
			validateAddProcess();
			initRowBatchDocBean(dbAccess);
		} catch (DBException dbe) {
			dbAccess.rollback();
		} finally {
			try {
				dbAccess.close();
			} catch (DBException ex) {
				ex.printStackTrace();

			}
		}
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (18/05/2003 16:23:26)
	 */
	public void initRowBatchDocBean(DBAccess dbAccess) throws Exception {

		StringBuffer sql = new StringBuffer();
		sql.append("insert into SHIFTER.SHF_BATCH_DOCS ");
		sql.append(
			"(PROCESS_DOC_KEY,PROCESS_KEY,TRIGGER_DATE,GEN_NUMBER,REC_SCANED,");
		sql.append(
			"REC_ADDED,REC_MODIFIED,REC_DELETED,REC_INVALID,PROCESS_STATUS,OPERATION_PRM,FILE_NAME,DOC_DESC)");
		sql.append(
			" VALUES (SHF_BATCH_DOCS_SEQ.NEXTVAL,?,sysdate,?,0,0,0,0,0,?,?,?,?) ");
		
		dbAccess.prepareStatement(sql.toString());
		
		dbAccess.setInteger(1, batchDocBean.getProcessKey());
		dbAccess.setInt(
			2,
			(batchDocBean.getGenerationNumber() != null)
				? batchDocBean.getGenerationNumber().intValue()
				: 0);
		dbAccess.setString(3, "R");
		dbAccess.setString(4, batchDocBean.getOperationPrm());
		dbAccess.setString(5, batchDocBean.getFileName());
		dbAccess.setString(6, batchDocBean.getDocDesc());

		dbAccess.executeUpdate();
		dbAccess.commit();
		// batchDocBean.setProcessDocKey(new Long(getProcessDocKey()));
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @param newProcessStatus java.lang.String
	 */
	public void setDocDesc(String docDesc, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append("update SHIFTER.SHF_BATCH_DOCS set DOC_DESC =? ");
		sql.append(" where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setString(1, docDesc);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:23)
	 * @param newRecordsAdded int
	 */
	public void setExecDate(DBAccess dbAccess) throws Exception {
//		batchDocBean.setExecutionDate(ShfDbUtil.DBSysdate());

		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set EXEC_DATE=sysdate where PROCESS_DOC_KEY =?");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setLong(1, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @param newProcessStatus java.lang.String
	 */
	public void setFileName(String fname, DBAccess dbAccess) throws Exception {
		batchDocBean.setFileName(fname);
		StringBuffer sql = new StringBuffer();
		sql.append("update SHIFTER.SHF_BATCH_DOCS set FILE_NAME =? ");
		sql.append(" where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setString(1, fname);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:23)
	 * @param newRecordsAdded int
	 */
	public void setGenNumber(int genNumber, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set GEN_NUMBER=?  where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, genNumber);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:24:47)
	 * @param newProcessStatus java.lang.String
	 */
	public void setProcessStatus(String processStatus, DBAccess dbAccess)
		throws Exception {

		batchDocBean.setProcessStatus(processStatus);
		StringBuffer sql = new StringBuffer();

		sql.append("update SHIFTER.SHF_BATCH_DOCS set PROCESS_STATUS =? ");
		sql.append(" where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setString(1, processStatus);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:23)
	 * @param newRecordsAdded int
	 */
	public void setRecords(
		int recAdded,
		int recDeleted,
		int recModified,
		int recInvalid,
		int recScanned,
		int genNumber,
		DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append("update SHIFTER.SHF_BATCH_DOCS set REC_ADDED=?, REC_MODIFIED =?, ");
		sql.append(" REC_DELETED=?, REC_INVALID=?, REC_SCANED=? ,GEN_NUMBER=?");
		sql.append("where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recAdded);
		dbAccess.setInt(2, recDeleted);
		dbAccess.setInt(3, recModified);
		dbAccess.setInt(4, recInvalid);
		dbAccess.setInt(5, recScanned);
		dbAccess.setInt(6, genNumber);
		dbAccess.setLong(7, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:23)
	 * @param newRecordsAdded int
	 */
	public void setRecordsAdded(int recordsAdded, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set REC_ADDED=?  where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recordsAdded);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:27:52)
	 * @param newRecordsDeleted int
	 */
	public void setRecordsDeleted(int recordsDeleted, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set REC_DELETED=? where PROCESS_DOC_KEY =?");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recordsDeleted);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:28:30)
	 * @param newRecordsInvalid int
	 */
	public void setRecordsInvalid(int recordsInvalid, DBAccess dbAccess)
		throws Exception {

		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set REC_INVALID=? where PROCESS_DOC_KEY =?");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recordsInvalid);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();

	}
	/**
	 * Insert the method's description here.
	 * Creation date: (20/05/2003 11:05:06)
	 * @param newRecordsModified int
	 */
	public void setRecordsModified(int recordsModified, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set REC_MODIFIED=? where PROCESS_DOC_KEY =?");

		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recordsModified);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (15/05/2003 14:28:48)
	 * @param newRecordsScanned int
	 */
	public void setRecordsScanned(int recordsScanned, DBAccess dbAccess)
		throws Exception {
		StringBuffer sql = new StringBuffer();
		sql.append(
			"update SHIFTER.SHF_BATCH_DOCS set REC_SCANED=? where PROCESS_DOC_KEY =?");
		dbAccess.prepareStatement(sql.toString());
		dbAccess.setInt(1, recordsScanned);
		dbAccess.setLong(2, batchDocBean.getProcessDocKey());
		dbAccess.executeUpdate();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (25/05/2003 12:37:21)
	 */
	public void update(DBAccess dbAccess) throws Exception {
		setRecords(
			batchDocBean.getRecordsAdded().intValue(),
			batchDocBean.getRecordsModified().intValue(),
			batchDocBean.getRecordsDeleted().intValue(),
			batchDocBean.getRecordsInvalid().intValue(),
			batchDocBean.getRecordsScanned().intValue(),
			(batchDocBean.getGenerationNumber() == null)
				? 0
				: batchDocBean.getGenerationNumber().intValue(),
			dbAccess);

		//   setProcessStatus(batchDocBean.getProcessStatus());

	}

	/**
	 * Checking if ready process exist .
	 * Creation date: (11/01/2004 15:56:09)
	 * @exception mdr.business.MdrException The exception description.
	 */
	public void validateAddProcess() throws Exception {
		//	if (batchDocBean.getSourceNameParam() != null && batchDocBean.getSourceNameParam().equalsIgnoreCase("oneReadyRow"))
		//		{
		//		if (ifHasReadyProcess(batchDocBean.getProcessKey()))
		//			throw new MdrException("mdr.error.maintenance.duplicateReadyRows");
		//	}
	}
}
