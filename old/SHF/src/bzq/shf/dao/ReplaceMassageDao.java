/*
 * Created on 22/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.sql.Timestamp;
import java.util.Date;
import java.util.Iterator;
import java.util.Vector;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.forms.BaseForm;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceMassageDao extends FactoryDao {
	private Logger logger = Logger.getLogger(EventReasonDao.class);

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryDao#select(java.lang.String)
	 */
	public boolean insert(BaseForm bf) throws ShfException{
		logger.debug("ReplaceMassageDao: insert");

		
		boolean isInsertReplaceMassage = false;
		ReplaceMassage replaceMassage = (ReplaceMassage)bf;

		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_REPLACE_MASSAGE (ID,EMPLOYEE_ID,CREATION_DATE,IS_READ,SUBJECT,TEXT,NOTE");
		if (replaceMassage.getMsgType() != null) {
			sql.append(",MSG_TYPE");
		}
		if (replaceMassage.getShiftId() > 0) {
			sql.append(",SHIFT_ID");
		}
		if (replaceMassage.getShiftStart() != null) {
			sql.append(",SHIFT_START");
		}
		if (replaceMassage.getShiftEnd() != null) {
			sql.append(",SHIFT_END");
		}
		if (replaceMassage.getOfferShiftId() > 0) {
			sql.append(",OFFER_SHIFT_ID");
		}
		if (replaceMassage.getOfferShiftStart() != null) {
			sql.append(",OFFER_SHIFT_START");
		}
		if (replaceMassage.getOfferShiftEnd() != null) {
			sql.append(",OFFER_SHIFT_END");
		}
		if (replaceMassage.getOfferEmployeeId() > 0) {
			sql.append(",OFFER_EMLOYEE_ID");
		}
		if (replaceMassage.getOfferFullName() != null) {
			sql.append(",OFFER_FULL_NAME");
		}
		
		sql.append(") VALUES (SHIFTER.SHF_REPLACE_MASSAGE_ID.NEXTVAL,?,?,'0',?,?,?");
		
		if (replaceMassage.getMsgType() != null) {
			sql.append(",?");
		}
		if (replaceMassage.getShiftId() > 0) {
			sql.append(",?");
		}
		if (replaceMassage.getShiftStart() != null) {
			sql.append(",?");
		}
		if (replaceMassage.getShiftEnd() != null) {
			sql.append(",?");
		}
		if (replaceMassage.getOfferShiftId() > 0) {
			sql.append(",?");
		}
		if (replaceMassage.getOfferShiftStart() != null) {
			sql.append(",?");
		}
		if (replaceMassage.getOfferShiftEnd() != null) {
			sql.append(",?");
		}
		if (replaceMassage.getOfferEmployeeId() > 0) {
			sql.append(",?");
		}
		if (replaceMassage.getOfferFullName() != null) {
			sql.append(",?");
		}
			
		sql.append(")");
		
		int index = 1;
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			
			dBAccess.prepareStatement(sql.toString());
			
			dBAccess.setInt(index++,replaceMassage.getEmpId());
			dBAccess.setTimestamp(index++,new Timestamp(System.currentTimeMillis()));
			dBAccess.setString(index++,replaceMassage.getSubject());
			dBAccess.setString(index++,replaceMassage.getText());
			dBAccess.setString(index++,replaceMassage.getNote());
			if (replaceMassage.getMsgType() != null) {
				dBAccess.setString(index++,replaceMassage.getMsgType());
			}
			if (replaceMassage.getShiftId() > 0) {
				dBAccess.setInt(index++,replaceMassage.getShiftId());
			}
			if (replaceMassage.getShiftStart() != null) {
				dBAccess.setTimestamp(index++,replaceMassage.getShiftStart());
			}
			if (replaceMassage.getShiftEnd() != null) {
				dBAccess.setTimestamp(index++,replaceMassage.getShiftEnd());
			}
			if (replaceMassage.getOfferShiftId() > 0) {
				dBAccess.setInt(index++,replaceMassage.getOfferShiftId());
			}
			if (replaceMassage.getOfferShiftStart() != null) {
				dBAccess.setTimestamp(index++,replaceMassage.getOfferShiftStart());
			}
			if (replaceMassage.getOfferShiftEnd() != null) {
				dBAccess.setTimestamp(index++,replaceMassage.getOfferShiftEnd());
			}
			if (replaceMassage.getOfferEmployeeId() > 0) {
				dBAccess.setInt(index++,replaceMassage.getOfferEmployeeId());
			}
			if (replaceMassage.getOfferFullName() != null) {
				dBAccess.setString(index++,replaceMassage.getOfferFullName());
			}
			int dbResult = dBAccess.executeUpdate();
			if ( dbResult > 0)
				isInsertReplaceMassage = true;		
		} catch (DBException e) {
			logger.error("error on ReplaceMassageDao insert ", e);
			throw new ShfException("error on ReplaceMassageDao insert", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("Error while db.close()", e);
			}
		}
		
		
	return isInsertReplaceMassage;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#update(int)
	 */
	public boolean updateToDel(Vector<String> msgs4del) throws ShfException{
		logger.debug("ReplaceMassageDao: updateToDel()");
		
		boolean isUpdateReplaceMassage = false;
		
		if (msgs4del == null || msgs4del.size() < 1) return isUpdateReplaceMassage;

		StringBuffer sql=new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_REPLACE_MASSAGE m SET IS_DELETED = 1 WHERE m.ID IN ( ");
		Iterator<String> iter = msgs4del.iterator();
		while (iter.hasNext()) {
			iter.next();
			sql.append("?");
			if (iter.hasNext()) {
				sql.append(",");
			}
		}
		sql.append(")");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());

			for  (int i=1; i<=msgs4del.size(); i++) {
				dBAccess.setInt(i , Integer.parseInt(  msgs4del.get(i-1) ));
			}
			
			if (dBAccess.executeUpdate() > 0)
				isUpdateReplaceMassage = true;
		}  catch(DBUpdateNoRowsException e){
			logger.debug("ReplaceMassageDao no rows updated " + e.getMessage());
		} catch (DBException e) {
			logger.error("error on ReplaceMassage updateToDel() " + e.getMessage());
			throw new ShfException("error on ReplaceMassage updateToDel()", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("updateToDel() db.close()", e);
			}
		}
		
		return isUpdateReplaceMassage;
	}
	
	/**
	 * Function to update messages to READ status
	 * 
	 */
	public void updateToRead(Vector<Integer> msgs4read, String empId) throws ShfException{
		
		if (msgs4read == null || msgs4read.size() < 1 || empId == null || empId == "") {
			logger.error("Error in updateToRead(), invalid one or more passed variables");
			return;
		}
		
		StringBuffer sql = new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_REPLACE_MASSAGE m ");
		sql.append("SET m.IS_READ = 1 ");
		sql.append("WHERE m.employee_id = ? ");
		sql.append("AND m.ID in (");
		Iterator<Integer> iter = msgs4read.iterator();
		while (iter.hasNext()) {
			iter.next();
			sql.append("?");
			if (iter.hasNext()) {
				sql.append(",");
			}
		}
		sql.append(")");
		
		DBAccess dBAccess = null;
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			
			dBAccess.setInt(1 , Integer.parseInt(empId));
			for  (int i = 2; i <= msgs4read.size()+1; i++) {
				dBAccess.setInt(i ,msgs4read.get(i-2) );
			}
			
			dBAccess.executeUpdate();
		} catch (DBUpdateNoRowsException e){
			
		} catch (DBException e) {
			logger.error("DB error on ReplaceMassageDao updateToRead() : " + e.getMessage());
		} finally {
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("Error in updateToRead() while dBAccess.close() : " + e.getMessage());
			}
		}
	}
	
	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#select()
	 */
	public Vector select(String empId) throws ShfException{
			logger.debug("ReplaceMassage: beginning of select()");
			Vector massages = null;

			StringBuffer sql=new StringBuffer();
			sql.append("SELECT m.* FROM SHIFTER.SHF_REPLACE_MASSAGE m WHERE (m.IS_DELETED = 0 OR m.IS_DELETED IS NULL) AND m.EMPLOYEE_ID>0 AND m.EMPLOYEE_ID = ? ");
			sql.append("ORDER BY m.CREATION_DATE DESC");
			
			DBAccess dBAccess=null;
			try {
				dBAccess=new DBAccess();
				dBAccess.prepareStatement(sql.toString());
				dBAccess.setInt(1,Integer.parseInt(empId));
				dBAccess.executeQuery();
				massages=new Vector();
				ReplaceMassage replaceMassage=null;
				while(dBAccess.next()){
					replaceMassage=new ReplaceMassage();
					dBAccess.populate(replaceMassage);
					massages.add(replaceMassage);
				}
	
	
	
			}  catch(DBQueryNoRowsException e){
				logger.debug("ReplaceMassage Table is empty " + e.getMessage());
			} catch (DBException e) {
				logger.error("error on ReplaceMassage massage.populate() " + e.getMessage());
				throw new ShfException("error on ReplaceMassage reasons populate()", e);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					throw new ShfException("db.close()", e);
				}
			}
		
		
		return massages;
	}


}
