/*
 * Created on 26/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.util.Date;
import java.util.Vector;

import javax.servlet.ServletContext;

import bzq.forms.BaseForm;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.transfer.OfferReplaceByCritrion;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceCandidates;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public abstract class SimpleFactoryDao {
	public static final int REPLACE_BY_CRITRION = 1;	
	public static final int REPLACE_ADMIN = 2;
	public final static int WORK_DAY = 4;
	public final static double TIME_BEFORE_SHIFT_BEGIN = 24.0;
	public final static long DEFUALT_TIME_BEFORE_SHIFT_BEGIN = 10;
	public final static double EMPLOYEE_MIN_TIME_BETWEEN_TWO_SHIFTS = 24.0;	
	public final static double MINUTE = 1.0/24/60;
	public final static long DEFUALT_EMPLOYEE_MIN_TIME_BETWEEN_TWO_SHIFTS = 8;
	public final static long HOUR_IN_MILLI = 3600000;
	public final static String SHIFT_ALLOWED = "1";
	public final static String OPEN_REPLACE_STATUS = "OPEN";
	public final static String WAIT_FOR_ANS_STATUS = "WAIT_FOR_ANS";
	public final static String CANCEL_REPLACE = "CANCEL_REPLACE";
	public final static String CLOSE_REPLACE = "CLOSE_REPLACE";
	
				  
	public abstract Vector selectMyWeekShifts(BaseForm bf) throws ShfException;
	public abstract Vector selectAppropriateReplaceCandidate(BaseForm bf) throws ShfException;
	public abstract Vector selectShiftsInReplaceRepository(String userId , String allowMoked ,String allowedAgaf) throws ShfException;
	public abstract Vector selectReplacementOffer(String myShiftId) throws ShfException;
	public abstract Vector selectReplacementOffer(Vector<String> shiftsIdVec) throws ShfException;
	public abstract Vector selectRangeShifts(Date startTime,String shiftId,String empIdNum) throws ShfException;
	public abstract boolean insertShiftToReplace(String myShiftId,String offerToShift,String status, String note) throws ShfException;
	public abstract boolean updateOfferShift(String myShiftId,String offerToShift) throws ShfException;
	public abstract boolean updateMyShiftToCancelReplace(String myShiftId,String status) throws ShfException;
	public abstract boolean updateReplacementOfferToOpen(String myShiftId, String offerShiftId) throws ShfException;
	public abstract boolean rejectReplaceOffer(String fromShiftId, String toShiftId,String status,String existStatus) throws ShfException;
	public abstract boolean acceptReplaceOffer(BaseForm bf,String status,String existStatus, ServletContext sCtx) throws ShfException;
	public abstract boolean deleteShiftFromRepository(String myShiftId) throws ShfException;
	public abstract boolean cancelOfferShift(String myShiftId,String offerToShift) throws ShfException;
	public abstract boolean isExistInRepository(String shiftId) throws ShfException;
	public abstract Vector <ReplaceByCritrion> checkShiftsInRange ( Vector <ReplaceByCritrion> candidates, AgentDayBean myday ) throws ShfException;
	public abstract boolean deleteOffersToMeFromRepository(String myShiftId, Vector<OfferReplaceByCritrion> offers) throws ShfException;
	public abstract boolean updateReplacementOfferToOpen( String myShiftId, Vector<OfferReplaceByCritrion> offers ) throws ShfException;
	public abstract Vector<ReplaceCandidates> getFromReplaceCandidatesByShiftId ( Vector<Integer> shiftIds ) throws ShfException;
	public abstract boolean insertShiftsToReplaceForSwitch(String myShiftId, Vector<String> offerToShifts) throws ShfException;
	public abstract Vector<OfferReplaceByCritrion> populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId( Vector<String> shiftsId ) throws ShfException;
				  
	  public static SimpleFactoryDao getDaoFactory(int whichDaoFactory)	{
		  switch(whichDaoFactory){
			case REPLACE_BY_CRITRION:
				return new ReplaceByCritrionDao();						  		
			default:
				return null;
		  }
	  }

}
