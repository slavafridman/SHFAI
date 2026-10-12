/*
 * Created on Dec 30, 2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.sql.PreparedStatement;
import java.util.Vector;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.forms.BaseForm;
import bzq.shf.utils.ShfException;
import bzq.shf.transfer.EventReason;


/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EventReasonDao extends FactoryAdminDao {
	private Logger logger = Logger.getLogger(EventReasonDao.class);	

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#delete(int)
	 */
	public boolean delete(int id) throws ShfException{
		logger.debug("EventReasonDao: delete id "+id+".");

		
		boolean isDeleteEventReason = false;

		StringBuffer sql=new StringBuffer();
		sql.append("DELETE FROM SHIFTER.SHF_EVENT_REASON WHERE REASON_ID=?");
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(1,id);
			if (dBAccess.executeUpdate()==1)
				isDeleteEventReason = true;		
		}  catch(DBQueryNoRowsException e){
			logger.debug("SHF_Event_Reason id not found" + e.getMessage());
		} catch (DBException e) {
			logger.error("error on EventReasonDao delete " + e.getMessage());
			throw new ShfException("error on EventReasonDao delete", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
	return isDeleteEventReason;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#insert(bzq.forms.BaseForm)
	 */
	public boolean insert(BaseForm bf) throws ShfException{
		logger.debug("EventReasonDao: insert");
		boolean isInsertEventReason = false;
		EventReason reason=null;

		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_EVENT_REASON (REASON_ID,BRANCH_ID,REASON_DESC,REPORTED,REPORT_REQUESTED,SER_TYPE) VALUES (SHIFTER.SHF_EVENT_REASON_ID.NEXTVAL,?,?,?,?,?)");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			reason = (EventReason)bf;
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,reason.getBranch());
			dBAccess.setString(2,reason.getReasonName());
			dBAccess.setString(3,String.valueOf(reason.getReported()));
			dBAccess.setString(4,String.valueOf(reason.getReportRequested()));
			dBAccess.setInt(5,reason.getType());
			if (dBAccess.executeUpdate()==1)
			isInsertEventReason = true;		
		} catch (DBException e) {
			logger.error("error on EventReasonDao insert " + e.getMessage());
			throw new ShfException("error on EventReasonDao insert", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
	return isInsertEventReason;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#update(int)
	 */
	public boolean update(BaseForm bf) throws ShfException{
		logger.debug("EventReasonDao: update");

		boolean isInsertEventReason = false;
		EventReason reason=null;

		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_EVENT_REASON SET BRANCH_ID=?,REASON_DESC=?,REPORTED=?,REPORT_REQUESTED=?,SER_TYPE=? WHERE REASON_ID=?");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			reason = (EventReason)bf;
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,reason.getBranch());
			dBAccess.setString(2,reason.getReasonName());
			dBAccess.setString(3,String.valueOf(reason.getReported()));
			dBAccess.setString(4,String.valueOf(reason.getReportRequested()));
			dBAccess.setInt(5,reason.getType());
			dBAccess.setInt(6,reason.getReasonId());			
			if (dBAccess.executeUpdate()==1)
			isInsertEventReason = true;		
		} catch (DBException e) {
			logger.error("error on EventReasonDao update " + e.getMessage());
			throw new ShfException("error on EventReasonDao update", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
	return isInsertEventReason;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#select()
	 */
	public Vector select(String param) throws ShfException{
		logger.debug("EventReasonDao: beginning of populate reasons.");
		Vector reasons = null;

		StringBuffer sql=new StringBuffer();
		sql.append("SELECT REASON_ID,BRANCH_ID,REASON_DESC,REPORTED,REPORT_REQUESTED,SER_TYPE FROM SHIFTER.SHF_EVENT_REASON r WHERE SER_TYPE=?");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(1,Integer.parseInt(param));
			dBAccess.executeQuery();
			reasons=new Vector();
			EventReason reason=null;
			while(dBAccess.next()){
				reason=new EventReason();
				dBAccess.populate(reason);
				reasons.add(reason);
			}

		}  catch(DBQueryNoRowsException e){
			logger.debug("SHF_Event_Reason Table is empty " + e.getMessage());
		} catch (DBException e) {
			logger.error("error on EventReasonDao reasons.populate() " + e.getMessage());
			throw new ShfException("error on EventReasonDao reasons populate()", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return reasons;
	}

}
