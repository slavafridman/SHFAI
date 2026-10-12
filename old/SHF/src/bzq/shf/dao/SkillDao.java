/*
 * Created on 25/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.util.Vector;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.forms.BaseForm;
import bzq.shf.transfer.SkillForm;
import bzq.shf.utils.ShfException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SkillDao extends FactoryAdminDao{
	
	Logger logger=Logger.getLogger(SkillDao.class);
	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#delete(int)
	 */
	public boolean delete(int id) throws ShfException {
		return false;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#insert(bzq.forms.BaseForm)
	 */
	public boolean insert(BaseForm bf) throws ShfException {
		return false;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#update(bzq.forms.BaseForm)
	 */
	public boolean update(BaseForm bf) throws ShfException {

		
		SkillForm skillForm=(SkillForm)bf;
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement("UPDATE SHIFTER.SHF_SKILLS S SET SKILL_DESC = ? WHERE SKILL_ID = ?");
			db.setString(1,skillForm.getSkillDesc());
			db.setInt(2,skillForm.getSkillId());
			db.executeUpdate();
		} catch (DBException e) {
			throw new ShfException("");
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return true;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.dao.FactoryAdminDao#select(java.lang.String)
	 */
	public Vector select(String param) throws ShfException {

		
		Vector skills = null;

		StringBuffer sql=new StringBuffer();
		sql.append("SELECT SKILL_ID,SKILL_NAME,SKILL_DESC,IS_LANGUAGE FROM SHIFTER.SHF_SKILLS ");
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.executeQuery();
			skills=new Vector();
			SkillForm skill=null;
			while(dBAccess.next()){
				skill=new SkillForm();
				dBAccess.populate(skill);
				skills.add(skill);
			}



		} catch(DBQueryNoRowsException e){
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
	
	
		return skills;
		}
	}


